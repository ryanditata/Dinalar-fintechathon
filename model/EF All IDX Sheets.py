import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import minimize
import random
import warnings
import os
warnings.filterwarnings('ignore')

# ===============================
# 0. FUNGSI UNTUK AUTO-RENAME FILE
# ===============================

def get_unique_filename(base_filename):
    """Mendapatkan nama file unik dengan menambahkan nomor urut jika file sudah ada"""
    if not os.path.exists(base_filename):
        return base_filename
    
    name, ext = os.path.splitext(base_filename)
    counter = 1
    while True:
        new_filename = f"{name}_{counter}{ext}"
        if not os.path.exists(new_filename):
            return new_filename
        counter += 1

def print_progress(current, total, process_name):
    """Mencetak progress dalam 10 titik (10%, 20%, ..., 100%)"""
    percent = current / total
    # Hitung persentase progress
    progress_step = int(percent * 10)
    prev_progress_step = int((current - 1) / total * 10) if current > 0 else -1
    
    # Tampilkan pada setiap kelipatan 10%
    if progress_step > prev_progress_step:
        print(f"   {process_name}: {progress_step * 10}% selesai")

# ===============================
# 1. FUNGSI UTAMA UNTUK ANALISIS PORTFOLIO
# ===============================

def portfolio_performance(weights, mean_returns, cov_matrix):
    """Return dan Volatility tahunan dalam persen"""
    returns = np.dot(weights, mean_returns) * 100
    volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights))) * 100
    return returns, volatility

def calculate_sharpe(weights, mean_returns, cov_matrix, risk_free_rate=0):
    """Sharpe Ratio (tahunan)"""
    ret, risk = portfolio_performance(weights, mean_returns, cov_matrix)
    if risk > 0:
        return (ret - risk_free_rate) / risk
    return 0

def calculate_sortino(weights, daily_returns, risk_free_rate=0):
    """Sortino Ratio (tahunan)"""
    portfolio_daily_returns = np.dot(daily_returns, weights)
    excess_return = np.mean(portfolio_daily_returns) - risk_free_rate
    excess_return_annual = excess_return * 252
    
    downside_returns = portfolio_daily_returns[portfolio_daily_returns < 0]
    if len(downside_returns) > 0:
        downside_deviation = np.sqrt(np.mean(downside_returns**2))
        downside_deviation_annual = downside_deviation * np.sqrt(252)
    else:
        downside_deviation_annual = 0.0001
    
    if downside_deviation_annual > 0:
        return excess_return_annual / downside_deviation_annual
    return 0

def calculate_omega(weights, daily_returns, threshold=0):
    """Omega Ratio"""
    portfolio_daily_returns = np.dot(daily_returns, weights)
    annual_returns = portfolio_daily_returns * 252
    
    gains = annual_returns[annual_returns > threshold] - threshold
    losses = threshold - annual_returns[annual_returns < threshold]
    
    if np.sum(losses) == 0:
        return np.inf
    return np.sum(gains) / np.sum(losses)

def portfolio_metrics(weights, mean_returns, cov_matrix, daily_returns):
    """Hitung semua metrik untuk portfolio"""
    ret, risk = portfolio_performance(weights, mean_returns, cov_matrix)
    return {
        'return': ret,
        'risk': risk,
        'sharpe': calculate_sharpe(weights, mean_returns, cov_matrix),
        'sortino': calculate_sortino(weights, daily_returns),
        'omega': calculate_omega(weights, daily_returns),
        'weights': weights.copy()
    }

def get_minimum_variance_portfolio(mean_returns, cov_matrix, n_assets):
    """Hitung portfolio dengan risk terendah (Global Minimum Variance Portfolio)"""
    def objective(weights):
        return portfolio_performance(weights, mean_returns, cov_matrix)[1]
    
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1})
    bounds = tuple((0, 1) for _ in range(n_assets))
    initial = np.array([1/n_assets] * n_assets)
    
    result = minimize(objective, initial, method='SLSQP', bounds=bounds, constraints=constraints)
    if result.success:
        return result.x, portfolio_performance(result.x, mean_returns, cov_matrix)
    return None, (None, None)

def get_max_return_portfolio(mean_returns, n_assets):
    """Hitung portfolio dengan return tertinggi"""
    max_ret_asset = np.argmax(mean_returns)
    w = np.zeros(n_assets)
    w[max_ret_asset] = 1
    return w

def get_efficient_frontier(mean_returns, cov_matrix, n_assets, n_points=50):
    """Hitung efficient frontier Markowitz yang benar"""
    mvp_weights, (mvp_return, mvp_risk) = get_minimum_variance_portfolio(mean_returns, cov_matrix, n_assets)
    if mvp_weights is None:
        return [], [], [], [], None, None
    
    # Portfolio dengan return tertinggi
    max_ret_weights = get_max_return_portfolio(mean_returns, n_assets)
    max_return, max_risk = portfolio_performance(max_ret_weights, mean_returns, cov_matrix)
    
    target_returns = np.linspace(mvp_return, max_return, n_points)
    
    def minimize_volatility(target_return):
        def objective(weights):
            return portfolio_performance(weights, mean_returns, cov_matrix)[1]
        
        constraints = (
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
            {'type': 'eq', 'fun': lambda w: np.dot(w, mean_returns) * 100 - target_return}
        )
        bounds = tuple((0, 1) for _ in range(n_assets))
        initial = mvp_weights.copy()
        
        try:
            result = minimize(objective, initial, method='SLSQP', bounds=bounds, constraints=constraints)
            if result.success:
                return result.x
            return None
        except:
            return None
    
    returns, risks, weights = [], [], []
    
    for i, r in enumerate(target_returns):
        w = minimize_volatility(r)
        if w is not None:
            ret, risk = portfolio_performance(w, mean_returns, cov_matrix)
            if not risks or risk >= risks[-1]:
                returns.append(ret)
                risks.append(risk)
                weights.append(w)
        print_progress(i + 1, len(target_returns), "Markowitz Frontier")
    
    return returns, risks, weights, mvp_return, mvp_risk

def get_5_points_by_metric(metrics_list, metric_name):
    """Mendapatkan 5 titik berdasarkan metrik tertentu"""
    if not metrics_list:
        return []
    
    values = [m[metric_name] for m in metrics_list]
    
    min_val = np.min(values)
    q1_val = np.percentile(values, 25)
    median_val = np.percentile(values, 50)
    q3_val = np.percentile(values, 75)
    max_val = np.max(values)
    
    points = []
    for target_val, label in [(min_val, 'Min'), (q1_val, 'Q1'), (median_val, 'Median'), 
                               (q3_val, 'Q3'), (max_val, 'Max')]:
        idx = np.argmin([abs(m[metric_name] - target_val) for m in metrics_list])
        points.append({
            'label': label,
            'target_value': target_val,
            'portfolio': metrics_list[idx],
            'index': idx
        })
    
    return points

def get_pareto_frontier(metrics_list):
    """Mendapatkan Pareto frontier dari kumpulan portfolio"""
    if not metrics_list:
        return [], []
    
    portfolios = [(m['return'], m['risk']) for m in metrics_list]
    portfolios.sort(key=lambda x: (-x[0], x[1]))
    
    pareto = []
    min_risk = float('inf')
    
    for ret, risk in portfolios:
        if risk < min_risk:
            pareto.append((ret, risk))
            min_risk = risk
    
    pareto.sort(key=lambda x: x[1])
    returns = [p[0] for p in pareto]
    risks = [p[1] for p in pareto]
    
    return returns, risks

def ga_generate_portfolios(mean_returns, cov_matrix, daily_returns, n_assets, mvp_return, max_return,
                           pop_size=1000, generations=100, verbose=True):
    """Generate banyak portfolio menggunakan GA dengan filter return antara MVP dan max return"""
    population = np.random.rand(pop_size, n_assets)
    population = population / np.sum(population, axis=1)[:, None]
    
    for gen in range(generations):
        fitness = []
        for ind in population:
            ret, _ = portfolio_performance(ind, mean_returns, cov_matrix)
            sharpe = calculate_sharpe(ind, mean_returns, cov_matrix)
            # Penalty jika return di luar range [mvp_return, max_return]
            if ret < mvp_return:
                penalty = 1000 * (mvp_return - ret)
                fitness.append(-sharpe + penalty)
            elif ret > max_return:
                penalty = 1000 * (ret - max_return)
                fitness.append(-sharpe + penalty)
            else:
                fitness.append(-sharpe)
        
        fitness = np.array(fitness)
        
        elite_size = pop_size // 10
        elite_idx = np.argsort(fitness)[:elite_size]
        elites = population[elite_idx]
        
        new_pop = list(elites)
        
        while len(new_pop) < pop_size:
            tournament = random.sample(range(pop_size), 5)
            p1_idx = tournament[np.argmin(fitness[tournament])]
            p2_idx = tournament[np.argmin(fitness[[i for i in tournament if i != p1_idx]])]
            
            p1, p2 = population[p1_idx], population[p2_idx]
            
            if random.random() < 0.8:
                child = np.where(np.random.rand(n_assets) < 0.5, p1, p2)
            else:
                child = p1.copy()
            
            if random.random() < 0.1:
                mutation_idx = random.randint(0, n_assets-1)
                child[mutation_idx] = random.random()
            
            child = child / np.sum(child)
            new_pop.append(child)
        
        population = np.array(new_pop[:pop_size])
        
        if verbose:
            print_progress(gen + 1, generations, "GA Progress")
    
    all_metrics = []
    for ind in population:
        ret, _ = portfolio_performance(ind, mean_returns, cov_matrix)
        if mvp_return <= ret <= max_return:
            all_metrics.append(portfolio_metrics(ind, mean_returns, cov_matrix, daily_returns))
    
    return population, all_metrics

def nsga_generate_portfolios(mean_returns, cov_matrix, daily_returns, n_assets, mvp_return, max_return,
                             pop_size=1000, generations=100, verbose=True):
    """Generate banyak portfolio menggunakan NSGA-II dengan filter return antara MVP dan max return"""
    population = np.random.rand(pop_size, n_assets)
    population = population / np.sum(population, axis=1)[:, None]
    
    def dominates(a, b):
        return (a['return'] >= b['return'] and a['risk'] <= b['risk'] and
                (a['return'] > b['return'] or a['risk'] < b['risk']))
    
    def crowding_distance(metrics_list):
        n = len(metrics_list)
        if n <= 2:
            return [float('inf')] * n
        
        distances = np.zeros(n)
        
        ret_vals = np.array([m['return'] for m in metrics_list])
        ret_idx = np.argsort(ret_vals)
        ret_range = ret_vals.max() - ret_vals.min()
        if ret_range > 0:
            distances[ret_idx[0]] = distances[ret_idx[-1]] = float('inf')
            for i in range(1, n-1):
                distances[ret_idx[i]] += (ret_vals[ret_idx[i+1]] - ret_vals[ret_idx[i-1]]) / ret_range
        
        risk_vals = np.array([m['risk'] for m in metrics_list])
        risk_idx = np.argsort(risk_vals)
        risk_range = risk_vals.max() - risk_vals.min()
        if risk_range > 0:
            distances[risk_idx[0]] = distances[risk_idx[-1]] = float('inf')
            for i in range(1, n-1):
                distances[risk_idx[i]] += (risk_vals[risk_idx[i+1]] - risk_vals[risk_idx[i-1]]) / risk_range
        
        return distances

    for gen in range(generations):
        metrics = []
        for ind in population:
            ret, _ = portfolio_performance(ind, mean_returns, cov_matrix)
            # Penalty jika return di luar range
            if ret < mvp_return:
                penalized_metrics = portfolio_metrics(ind, mean_returns, cov_matrix, daily_returns)
                penalized_metrics['return'] = mvp_return - 1000 * (mvp_return - ret)
                metrics.append(penalized_metrics)
            elif ret > max_return:
                penalized_metrics = portfolio_metrics(ind, mean_returns, cov_matrix, daily_returns)
                penalized_metrics['return'] = max_return - 1000 * (ret - max_return)
                metrics.append(penalized_metrics)
            else:
                metrics.append(portfolio_metrics(ind, mean_returns, cov_matrix, daily_returns))
        
        n = len(population)
        domination_count = np.zeros(n)
        dominated_by = [[] for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    if dominates(metrics[i], metrics[j]):
                        dominated_by[i].append(j)
                    elif dominates(metrics[j], metrics[i]):
                        domination_count[i] += 1
        
        fronts = []
        remaining = set(range(n))
        while remaining:
            front = [i for i in remaining if domination_count[i] == 0]
            fronts.append(front)
            remaining -= set(front)
            for i in front:
                for j in dominated_by[i]:
                    domination_count[j] -= 1
        
        selected = []
        for front in fronts:
            if len(selected) + len(front) <= pop_size:
                selected.extend(front)
            else:
                front_metrics = [metrics[i] for i in front]
                distances = crowding_distance(front_metrics)
                front_with_dist = list(zip(front, distances))
                front_with_dist.sort(key=lambda x: x[1], reverse=True)
                needed = pop_size - len(selected)
                selected.extend([i for i, _ in front_with_dist[:needed]])
                break
        
        offspring = []
        while len(offspring) < pop_size:
            p1, p2 = random.sample(selected, 2)
            parent1, parent2 = population[p1], population[p2]
            
            if random.random() < 0.9:
                child = np.where(np.random.rand(n_assets) < 0.5, parent1, parent2)
            else:
                child = parent1.copy()
            
            if random.random() < 0.1:
                child[random.randint(0, n_assets-1)] = random.random()
            
            child = child / np.sum(child)
            offspring.append(child)
        
        combined = np.vstack([population, np.array(offspring)])
        population = combined[selected][:pop_size]
        
        if verbose:
            print_progress(gen + 1, generations, "NSGA-II Progress")
    
    all_metrics = []
    for ind in population:
        ret, _ = portfolio_performance(ind, mean_returns, cov_matrix)
        if mvp_return <= ret <= max_return:
            all_metrics.append(portfolio_metrics(ind, mean_returns, cov_matrix, daily_returns))
    
    return population, all_metrics

# ===============================
# 2. FUNGSI UNTUK ANALISIS SATU DATASET
# ===============================

def analyze_dataset(data, sheet_name, n_random=2000):
    """Analisis lengkap untuk satu dataset"""
    print(f"\n{'='*80}")
    print(f"ANALYZING: {sheet_name}")
    print(f"{'='*80}")
    
    # Hitung returns dan covariance
    log_returns = np.log(data / data.shift(1)).dropna()
    mean_returns = log_returns.mean()
    cov_matrix = log_returns.cov()
    daily_returns = data.pct_change().dropna() * 100
    
    n_assets = len(mean_returns)
    print(f"   Jumlah aset: {n_assets}")
    print(f"   Aset: {list(data.columns)}")
    print(f"   Periode data: {len(daily_returns)} hari")
    
    # Markowitz Efficient Frontier
    print("\n   Menghitung Markowitz Efficient Frontier...")
    mv_ret, mv_risk, mv_weights, mvp_return, mvp_risk = get_efficient_frontier(mean_returns, cov_matrix, n_assets)
    mv_metrics = [portfolio_metrics(w, mean_returns, cov_matrix, daily_returns) for w in mv_weights]
    
    # Portfolio dengan return tertinggi
    max_ret_weights = get_max_return_portfolio(mean_returns, n_assets)
    max_return, max_risk = portfolio_performance(max_ret_weights, mean_returns, cov_matrix)
    
    print(f"   Markowitz Frontier: {len(mv_ret)} portfolio")
    print(f"   MVP: Return={mvp_return:.2f}%, Risk={mvp_risk:.2f}%")
    print(f"   Max Return: Return={max_return:.2f}%, Risk={max_risk:.2f}%")
    
    # 5 titik untuk Markowitz
    mv_sharpe_points = get_5_points_by_metric(mv_metrics, 'sharpe')
    mv_sortino_points = get_5_points_by_metric(mv_metrics, 'sortino')
    mv_omega_points = get_5_points_by_metric(mv_metrics, 'omega')
    
    # GA (dengan filter return antara MVP dan max return)
    print("\n   Menjalankan Genetic Algorithm...")
    ga_pop, ga_metrics = ga_generate_portfolios(mean_returns, cov_matrix, daily_returns, n_assets, 
                                                 mvp_return, max_return, verbose=True)
    ga_pareto_ret, ga_pareto_risk = get_pareto_frontier(ga_metrics)
    ga_sharpe_points = get_5_points_by_metric(ga_metrics, 'sharpe')
    ga_sortino_points = get_5_points_by_metric(ga_metrics, 'sortino')
    ga_omega_points = get_5_points_by_metric(ga_metrics, 'omega')
    print(f"   GA: {len(ga_metrics)} portfolio, Pareto: {len(ga_pareto_ret)}")
    
    # NSGA-II (dengan filter return antara MVP dan max return)
    print("\n   Menjalankan NSGA-II...")
    nsga_pop, nsga_metrics = nsga_generate_portfolios(mean_returns, cov_matrix, daily_returns, n_assets, 
                                                       mvp_return, max_return, verbose=True)
    nsga_pareto_ret, nsga_pareto_risk = get_pareto_frontier(nsga_metrics)
    nsga_sharpe_points = get_5_points_by_metric(nsga_metrics, 'sharpe')
    nsga_sortino_points = get_5_points_by_metric(nsga_metrics, 'sortino')
    nsga_omega_points = get_5_points_by_metric(nsga_metrics, 'omega')
    print(f"   NSGA-II: {len(nsga_metrics)} portfolio, Pareto: {len(nsga_pareto_ret)}")
    
    # Random portfolios (dengan batas maksimum 1000 iterasi per portfolio)
    print("\n   Menghasilkan Random Portfolios...")
    random_metrics = []
    max_attempts = 1000  # Batas maksimum percobaan per portfolio
    skipped_count = 0
    
    for i in range(n_random):
        found = False
        for attempt in range(max_attempts):
            w = np.random.rand(n_assets)
            w = w / np.sum(w)
            ret, _ = portfolio_performance(w, mean_returns, cov_matrix)
            if mvp_return <= ret <= max_return:
                random_metrics.append(portfolio_metrics(w, mean_returns, cov_matrix, daily_returns))
                found = True
                break
        
        if not found:
            skipped_count += 1
            # Jika tidak ditemukan, coba lagi dengan bobot yang lebih terdistribusi
            # Alternatif: buat portfolio dengan bobot yang lebih merata
            w = np.ones(n_assets) / n_assets
            ret, _ = portfolio_performance(w, mean_returns, cov_matrix)
            if mvp_return <= ret <= max_return:
                random_metrics.append(portfolio_metrics(w, mean_returns, cov_matrix, daily_returns))
            else:
                # Jika masih gagal, lewati
                pass
        
        print_progress(i + 1, n_random, "Random Progress")
    
    if skipped_count > 0:
        print(f"   Peringatan: {skipped_count} portfolio gagal dihasilkan (melebihi {max_attempts} percobaan)")
    
    random_pareto_ret, random_pareto_risk = get_pareto_frontier(random_metrics)
    random_sharpe_points = get_5_points_by_metric(random_metrics, 'sharpe')
    random_sortino_points = get_5_points_by_metric(random_metrics, 'sortino')
    random_omega_points = get_5_points_by_metric(random_metrics, 'omega')
    print(f"   Random: {len(random_metrics)} portfolio (filtered)")
    
    # Kumpulkan hasil
    results = {
        'sheet_name': sheet_name,
        'n_assets': n_assets,
        'asset_names': list(data.columns),
        'mean_returns': mean_returns,
        'cov_matrix': cov_matrix,
        'daily_returns': daily_returns,
        'mv_ret': mv_ret,
        'mv_risk': mv_risk,
        'mv_weights': mv_weights,
        'mv_metrics': mv_metrics,
        'mv_sharpe_points': mv_sharpe_points,
        'mv_sortino_points': mv_sortino_points,
        'mv_omega_points': mv_omega_points,
        'ga_metrics': ga_metrics,
        'ga_pareto_ret': ga_pareto_ret,
        'ga_pareto_risk': ga_pareto_risk,
        'ga_sharpe_points': ga_sharpe_points,
        'ga_sortino_points': ga_sortino_points,
        'ga_omega_points': ga_omega_points,
        'nsga_metrics': nsga_metrics,
        'nsga_pareto_ret': nsga_pareto_ret,
        'nsga_pareto_risk': nsga_pareto_risk,
        'nsga_sharpe_points': nsga_sharpe_points,
        'nsga_sortino_points': nsga_sortino_points,
        'nsga_omega_points': nsga_omega_points,
        'random_metrics': random_metrics,
        'random_pareto_ret': random_pareto_ret,
        'random_pareto_risk': random_pareto_risk,
        'random_sharpe_points': random_sharpe_points,
        'random_sortino_points': random_sortino_points,
        'random_omega_points': random_omega_points,
        'mvp_ret': mvp_return,
        'mvp_risk': mvp_risk,
        'max_return': max_return,
        'max_risk': max_risk
    }
    
    return results

# ===============================
# 3. FUNGSI UNTUK MEMBUAT TABEL KOMPOSISI PORTFOLIO
# ===============================

def create_portfolio_composition_table(results):
    """Membuat tabel komposisi portfolio untuk setiap analisis"""
    sheet_name = results['sheet_name']
    asset_names = results['asset_names']
    
    portfolio_data = []
    
    # Markowitz - 5 titik untuk setiap metrik
    for p in results['mv_sharpe_points']:
        portfolio = p['portfolio']
        row = {
            'Sheet': sheet_name,
            'Method': 'Markowitz',
            'Metric': 'Sharpe',
            'Quantile': p['label'],
            'Return (%)': portfolio['return'],
            'Risk (%)': portfolio['risk'],
            'Sharpe': portfolio['sharpe'],
            'Sortino': portfolio['sortino'],
            'Omega': portfolio['omega']
        }
        for i, asset in enumerate(asset_names):
            row[f'Weight_{asset}'] = portfolio['weights'][i] * 100
        portfolio_data.append(row)
    
    for p in results['mv_sortino_points']:
        portfolio = p['portfolio']
        row = {
            'Sheet': sheet_name,
            'Method': 'Markowitz',
            'Metric': 'Sortino',
            'Quantile': p['label'],
            'Return (%)': portfolio['return'],
            'Risk (%)': portfolio['risk'],
            'Sharpe': portfolio['sharpe'],
            'Sortino': portfolio['sortino'],
            'Omega': portfolio['omega']
        }
        for i, asset in enumerate(asset_names):
            row[f'Weight_{asset}'] = portfolio['weights'][i] * 100
        portfolio_data.append(row)
    
    for p in results['mv_omega_points']:
        portfolio = p['portfolio']
        row = {
            'Sheet': sheet_name,
            'Method': 'Markowitz',
            'Metric': 'Omega',
            'Quantile': p['label'],
            'Return (%)': portfolio['return'],
            'Risk (%)': portfolio['risk'],
            'Sharpe': portfolio['sharpe'],
            'Sortino': portfolio['sortino'],
            'Omega': portfolio['omega']
        }
        for i, asset in enumerate(asset_names):
            row[f'Weight_{asset}'] = portfolio['weights'][i] * 100
        portfolio_data.append(row)
    
    # GA - 5 titik terbaik untuk setiap metrik
    for metric_name, points in [('Sharpe', results['ga_sharpe_points']),
                                 ('Sortino', results['ga_sortino_points']),
                                 ('Omega', results['ga_omega_points'])]:
        for p in points:
            portfolio = p['portfolio']
            row = {
                'Sheet': sheet_name,
                'Method': 'GA',
                'Metric': metric_name,
                'Quantile': p['label'],
                'Return (%)': portfolio['return'],
                'Risk (%)': portfolio['risk'],
                'Sharpe': portfolio['sharpe'],
                'Sortino': portfolio['sortino'],
                'Omega': portfolio['omega']
            }
            for i, asset in enumerate(asset_names):
                row[f'Weight_{asset}'] = portfolio['weights'][i] * 100
            portfolio_data.append(row)
    
    # NSGA-II - 5 titik terbaik untuk setiap metrik
    for metric_name, points in [('Sharpe', results['nsga_sharpe_points']),
                                 ('Sortino', results['nsga_sortino_points']),
                                 ('Omega', results['nsga_omega_points'])]:
        for p in points:
            portfolio = p['portfolio']
            row = {
                'Sheet': sheet_name,
                'Method': 'NSGA-II',
                'Metric': metric_name,
                'Quantile': p['label'],
                'Return (%)': portfolio['return'],
                'Risk (%)': portfolio['risk'],
                'Sharpe': portfolio['sharpe'],
                'Sortino': portfolio['sortino'],
                'Omega': portfolio['omega']
            }
            for i, asset in enumerate(asset_names):
                row[f'Weight_{asset}'] = portfolio['weights'][i] * 100
            portfolio_data.append(row)
    
    # Random - 5 titik terbaik untuk setiap metrik
    for metric_name, points in [('Sharpe', results['random_sharpe_points']),
                                 ('Sortino', results['random_sortino_points']),
                                 ('Omega', results['random_omega_points'])]:
        for p in points:
            portfolio = p['portfolio']
            row = {
                'Sheet': sheet_name,
                'Method': 'Random',
                'Metric': metric_name,
                'Quantile': p['label'],
                'Return (%)': portfolio['return'],
                'Risk (%)': portfolio['risk'],
                'Sharpe': portfolio['sharpe'],
                'Sortino': portfolio['sortino'],
                'Omega': portfolio['omega']
            }
            for i, asset in enumerate(asset_names):
                row[f'Weight_{asset}'] = portfolio['weights'][i] * 100
            portfolio_data.append(row)
    
    return pd.DataFrame(portfolio_data)

# ===============================
# 4. FUNGSI UNTUK MEMBUAT PLOT SATU DATASET
# ===============================

def plot_single_dataset(results, output_filename):
    """Membuat 4 grafik untuk satu dataset"""
    fig, axes = plt.subplots(2, 2, figsize=(18, 14))
    
    # Konfigurasi
    method_config = {
        'Markowitz': {'color': 'blue', 'zorder': 6, 'line_color': 'blue'},
        'GA': {'color': 'red', 'zorder': 6, 'line_color': 'red'},
        'NSGA-II': {'color': 'purple', 'zorder': 6, 'line_color': 'purple'},
        'Random': {'color': 'gray', 'zorder': 5, 'line_color': 'gray'}
    }
    
    quantile_markers = {'Min': 'o', 'Q1': 's', 'Median': '^', 'Q3': 'D', 'Max': '*'}
    quantile_base_sizes = {'Min': 100, 'Q1': 110, 'Median': 120, 'Q3': 110, 'Max': 140}
    metric_outline_colors = {'Sharpe': 'gold', 'Sortino': 'limegreen', 'Omega': 'orange'}
    
    # Data dari results
    random_metrics = results['random_metrics']
    mv_ret, mv_risk = results['mv_ret'], results['mv_risk']
    ga_pareto_ret, ga_pareto_risk = results['ga_pareto_ret'], results['ga_pareto_risk']
    nsga_pareto_ret, nsga_pareto_risk = results['nsga_pareto_ret'], results['nsga_pareto_risk']
    
    for idx, (ax, title_suffix) in enumerate([
        (axes[0, 0], 'All Metrics'),
        (axes[0, 1], 'Sharpe Ratio Only'),
        (axes[1, 0], 'Sortino Ratio Only'),
        (axes[1, 1], 'Omega Ratio Only')
    ]):
        # Random background
        ax.scatter([m['risk'] for m in random_metrics], [m['return'] for m in random_metrics],
                   c='lightgray', alpha=0.1, s=5, label=f'Random ({len(random_metrics)})', zorder=1)
        
        # Efficient Frontiers
        ax.plot(mv_risk, mv_ret, 'b-', linewidth=2.5, label='Markowitz', alpha=0.9, zorder=2)
        if ga_pareto_ret:
            ax.plot(ga_pareto_risk, ga_pareto_ret, 'r--', linewidth=2, label='GA Pareto', alpha=0.8, zorder=2)
        if nsga_pareto_ret:
            ax.plot(nsga_pareto_risk, nsga_pareto_ret, 'purple', linestyle='--', linewidth=2, label='NSGA-II Pareto', alpha=0.8, zorder=2)
        
        # MVP
        if results['mvp_ret'] is not None:
            ax.scatter(results['mvp_risk'], results['mvp_ret'], c='blue', marker='o', s=200,
                       label='Global Min Variance', edgecolors='darkblue', linewidth=2, zorder=5)
        
        # Max Return
        if results.get('max_return') is not None:
            ax.scatter(results['max_risk'], results['max_return'], c='blue', marker='s', s=150,
                       label='Max Return Portfolio', edgecolors='darkblue', linewidth=2, zorder=5)
        
        # Plot points berdasarkan metrik
        if idx == 0:  # All metrics
            for method_name in ['Markowitz', 'GA', 'NSGA-II', 'Random']:
                color = method_config[method_name]['color']
                size_mult = 1.0
                
                if method_name == 'Markowitz':
                    sharpe_pts = results['mv_sharpe_points']
                    sortino_pts = results['mv_sortino_points']
                    omega_pts = results['mv_omega_points']
                elif method_name == 'GA':
                    sharpe_pts = results['ga_sharpe_points']
                    sortino_pts = results['ga_sortino_points']
                    omega_pts = results['ga_omega_points']
                elif method_name == 'NSGA-II':
                    sharpe_pts = results['nsga_sharpe_points']
                    sortino_pts = results['nsga_sortino_points']
                    omega_pts = results['nsga_omega_points']
                else:
                    sharpe_pts = results['random_sharpe_points']
                    sortino_pts = results['random_sortino_points']
                    omega_pts = results['random_omega_points']
                    size_mult = 0.7
                
                for p in sharpe_pts:
                    size = int(quantile_base_sizes[p['label']] * size_mult)
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker=quantile_markers[p['label']], s=size,
                              edgecolors=metric_outline_colors['Sharpe'], linewidth=2,
                              label=f"{method_name}-Sharpe {p['label']}" if method_name == 'Markowitz' and p['label'] == 'Min' else "",
                              zorder=method_config[method_name]['zorder'])
                
                for p in sortino_pts:
                    size = int(quantile_base_sizes[p['label']] * size_mult)
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker=quantile_markers[p['label']], s=size,
                              edgecolors=metric_outline_colors['Sortino'], linewidth=2,
                              label=f"{method_name}-Sortino {p['label']}" if method_name == 'Markowitz' and p['label'] == 'Q1' else "",
                              zorder=method_config[method_name]['zorder'])
                
                for p in omega_pts:
                    size = int(quantile_base_sizes[p['label']] * size_mult)
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker=quantile_markers[p['label']], s=size,
                              edgecolors=metric_outline_colors['Omega'], linewidth=2,
                              label=f"{method_name}-Omega {p['label']}" if method_name == 'Markowitz' and p['label'] == 'Median' else "",
                              zorder=method_config[method_name]['zorder'])
        
        elif idx == 1:  # Sharpe only
            for method_name in ['Markowitz', 'GA', 'NSGA-II', 'Random']:
                color = method_config[method_name]['color']
                size_mult = 1.0 if method_name != 'Random' else 0.7
                
                if method_name == 'Markowitz':
                    points = results['mv_sharpe_points']
                elif method_name == 'GA':
                    points = results['ga_sharpe_points']
                elif method_name == 'NSGA-II':
                    points = results['nsga_sharpe_points']
                else:
                    points = results['random_sharpe_points']
                
                for p in points:
                    size = int(quantile_base_sizes[p['label']] * size_mult)
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker=quantile_markers[p['label']], s=size,
                              edgecolors=metric_outline_colors['Sharpe'], linewidth=2,
                              label=f"{method_name} {p['label']}" if method_name == 'Markowitz' and p['label'] == 'Min' else "",
                              zorder=method_config[method_name]['zorder'])
        
        elif idx == 2:  # Sortino only
            for method_name in ['Markowitz', 'GA', 'NSGA-II', 'Random']:
                color = method_config[method_name]['color']
                size_mult = 1.0 if method_name != 'Random' else 0.7
                
                if method_name == 'Markowitz':
                    points = results['mv_sortino_points']
                elif method_name == 'GA':
                    points = results['ga_sortino_points']
                elif method_name == 'NSGA-II':
                    points = results['nsga_sortino_points']
                else:
                    points = results['random_sortino_points']
                
                for p in points:
                    size = int(quantile_base_sizes[p['label']] * size_mult)
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker=quantile_markers[p['label']], s=size,
                              edgecolors=metric_outline_colors['Sortino'], linewidth=2,
                              label=f"{method_name} {p['label']}" if method_name == 'Markowitz' and p['label'] == 'Min' else "",
                              zorder=method_config[method_name]['zorder'])
        
        else:  # Omega only
            for method_name in ['Markowitz', 'GA', 'NSGA-II', 'Random']:
                color = method_config[method_name]['color']
                size_mult = 1.0 if method_name != 'Random' else 0.7
                
                if method_name == 'Markowitz':
                    points = results['mv_omega_points']
                elif method_name == 'GA':
                    points = results['ga_omega_points']
                elif method_name == 'NSGA-II':
                    points = results['nsga_omega_points']
                else:
                    points = results['random_omega_points']
                
                for p in points:
                    size = int(quantile_base_sizes[p['label']] * size_mult)
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker=quantile_markers[p['label']], s=size,
                              edgecolors=metric_outline_colors['Omega'], linewidth=2,
                              label=f"{method_name} {p['label']}" if method_name == 'Markowitz' and p['label'] == 'Min' else "",
                              zorder=method_config[method_name]['zorder'])
        
        ax.set_xlabel('Risk (Volatility, %)', fontsize=11)
        ax.set_ylabel('Expected Return (%)', fontsize=11)
        ax.set_title(f'{results["sheet_name"]} - {title_suffix}', fontsize=12)
        ax.grid(True, alpha=0.3)
        ax.legend(loc='lower right', fontsize=7, ncol=2)
    
    plt.tight_layout()
    plt.savefig(output_filename, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"   Plot saved: {output_filename}")

# ===============================
# 5. FUNGSI UNTUK MEMBUAT PLOT PERBANDINGAN
# ===============================

def plot_comparison(all_results, output_filename):
    """Membuat plot perbandingan antar sheet dan gabungan"""
    fig, axes = plt.subplots(2, 2, figsize=(18, 14))
    
    colors = ['blue', 'red', 'green', 'orange', 'purple', 'brown']
    
    for idx, (ax, title_suffix) in enumerate([
        (axes[0, 0], 'Return vs Risk - All Methods'),
        (axes[0, 1], 'Return vs Risk - Sharpe Ratio Only'),
        (axes[1, 0], 'Return vs Risk - Sortino Ratio Only'),
        (axes[1, 1], 'Return vs Risk - Omega Ratio Only')
    ]):
        for i, results in enumerate(all_results):
            color = colors[i % len(colors)]
            sheet_name = results['sheet_name']
            
            # Plot Pareto frontier
            if results['mv_ret']:
                ax.plot(results['mv_risk'], results['mv_ret'], 
                       color=color, linestyle='-', linewidth=2, 
                       label=f'{sheet_name} (Markowitz)', alpha=0.8)
            
            if results['ga_pareto_ret']:
                ax.plot(results['ga_pareto_risk'], results['ga_pareto_ret'], 
                       color=color, linestyle='--', linewidth=1.5, 
                       label=f'{sheet_name} (GA)', alpha=0.7)
            
            if results['nsga_pareto_ret']:
                ax.plot(results['nsga_pareto_risk'], results['nsga_pareto_ret'], 
                       color=color, linestyle=':', linewidth=1.5, 
                       label=f'{sheet_name} (NSGA-II)', alpha=0.7)
            
            # Plot 5 titik untuk metode terbaik (Markowitz)
            if idx == 0:  # All metrics
                for p in results['mv_sharpe_points']:
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker='o', s=60,
                              edgecolors='gold', linewidth=1.5, alpha=0.8)
                for p in results['mv_sortino_points']:
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker='s', s=60,
                              edgecolors='limegreen', linewidth=1.5, alpha=0.8)
                for p in results['mv_omega_points']:
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker='^', s=60,
                              edgecolors='orange', linewidth=1.5, alpha=0.8)
            elif idx == 1:  # Sharpe only
                for p in results['mv_sharpe_points']:
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker='o', s=70,
                              edgecolors='gold', linewidth=2, alpha=0.9)
            elif idx == 2:  # Sortino only
                for p in results['mv_sortino_points']:
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker='s', s=70,
                              edgecolors='limegreen', linewidth=2, alpha=0.9)
            else:  # Omega only
                for p in results['mv_omega_points']:
                    ax.scatter(p['portfolio']['risk'], p['portfolio']['return'],
                              c=color, marker='^', s=70,
                              edgecolors='orange', linewidth=2, alpha=0.9)
        
        ax.set_xlabel('Risk (Volatility, %)', fontsize=11)
        ax.set_ylabel('Expected Return (%)', fontsize=11)
        ax.set_title(f'Comparison - {title_suffix}', fontsize=12)
        ax.grid(True, alpha=0.3)
        ax.legend(loc='lower right', fontsize=8, ncol=2)
    
    plt.tight_layout()
    plt.savefig(output_filename, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"   Comparison plot saved: {output_filename}")

# ===============================
# 6. FUNGSI UNTUK MENGGABUNGKAN SEMUA ASET
# ===============================

def combine_all_assets(all_data, sheet_names):
    """Menggabungkan semua aset dari semua sheet"""
    combined_data = pd.DataFrame()
    
    for sheet_name, data in zip(sheet_names, all_data):
        # Tambahkan prefix sheet name ke kolom
        renamed_cols = {col: f"{sheet_name}_{col}" for col in data.columns}
        sheet_data = data.rename(columns=renamed_cols)
        combined_data = pd.concat([combined_data, sheet_data], axis=1)
    
    return combined_data

# ===============================
# 7. MAIN PROGRAM
# ===============================

def main():
    # Load file Excel
    file_path = 'Data_IDX.xlsx'
    print("="*80)
    print("MULTI-SHEET PORTFOLIO ANALYSIS (With MVP-Max Return Filter & Auto-Rename)")
    print("="*80)
    
    # Baca semua sheet
    excel_file = pd.ExcelFile(file_path)
    sheet_names = excel_file.sheet_names
    print(f"\nFound sheets: {sheet_names}")
    
    # Baca data setiap sheet
    all_data = []
    for sheet in sheet_names:
        data = pd.read_excel(file_path, sheet_name=sheet)
        data.set_index(data.columns[0], inplace=True)
        all_data.append(data)
        print(f"   Sheet '{sheet}': {len(data.columns)} assets, {len(data)} rows")
    
    # Analisis setiap sheet
    all_results = []
    all_composition_dfs = []
    
    for i, (sheet_name, data) in enumerate(zip(sheet_names, all_data)):
        print(f"\n{'='*80}")
        print(f"PROCESSING SHEET {i+1}: {sheet_name}")
        print(f"{'='*80}")
        results = analyze_dataset(data, sheet_name)
        all_results.append(results)
        
        # Plot untuk sheet ini (dengan auto-rename)
        plot_filename = get_unique_filename(f'plot_{sheet_name}.png')
        plot_single_dataset(results, plot_filename)
        
        # Buat tabel komposisi portfolio
        comp_df = create_portfolio_composition_table(results)
        all_composition_dfs.append(comp_df)
    
    # Gabungkan semua aset
    print(f"\n{'='*80}")
    print("COMBINING ALL ASSETS")
    print(f"{'='*80}")
    combined_data = combine_all_assets(all_data, sheet_names)
    print(f"   Combined assets: {len(combined_data.columns)} assets")
    
    # Analisis dataset gabungan
    combined_results = analyze_dataset(combined_data, 'ALL_COMBINED')
    all_results.append(combined_results)
    
    plot_filename = get_unique_filename('plot_ALL_COMBINED.png')
    plot_single_dataset(combined_results, plot_filename)
    
    # Buat tabel komposisi untuk gabungan
    comp_df_combined = create_portfolio_composition_table(combined_results)
    all_composition_dfs.append(comp_df_combined)
    
    # Plot perbandingan semua sheet + gabungan (dengan auto-rename)
    print(f"\n{'='*80}")
    print("CREATING COMPARISON PLOTS")
    print(f"{'='*80}")
    plot_filename = get_unique_filename('plot_comparison_all.png')
    plot_comparison(all_results, plot_filename)
    
    # ===============================
    # 8. SAVE ALL COMPOSITION TABLES
    # ===============================
    
    print(f"\n{'='*80}")
    print("SAVING PORTFOLIO COMPOSITION TABLES")
    print(f"{'='*80}")
    
    # Gabungkan semua tabel komposisi
    all_composition_df = pd.concat(all_composition_dfs, ignore_index=True)
    
    # Bulatkan nilai numerik
    numeric_cols = ['Return (%)', 'Risk (%)', 'Sharpe', 'Sortino', 'Omega']
    weight_cols = [col for col in all_composition_df.columns if col.startswith('Weight_')]
    all_cols = numeric_cols + weight_cols
    
    for col in all_cols:
        if col in all_composition_df.columns:
            if col in ['Return (%)', 'Risk (%)']:
                all_composition_df[col] = all_composition_df[col].round(2)
            elif col in ['Sharpe', 'Sortino']:
                all_composition_df[col] = all_composition_df[col].round(4)
            elif col == 'Omega':
                all_composition_df[col] = all_composition_df[col].round(2)
            elif col.startswith('Weight_'):
                all_composition_df[col] = all_composition_df[col].round(2)
    
    # Simpan ke Excel dengan auto-rename
    excel_filename = get_unique_filename('portfolio_composition_all.xlsx')
    with pd.ExcelWriter(excel_filename) as writer:
        # Sheet 1: Semua komposisi
        all_composition_df.to_excel(writer, sheet_name='All_Compositions', index=False)
        
        # Sheet terpisah untuk setiap sheet asli
        for sheet_name in sheet_names:
            sheet_df = all_composition_df[all_composition_df['Sheet'] == sheet_name]
            if not sheet_df.empty:
                sheet_df.to_excel(writer, sheet_name=f'Comp_{sheet_name}', index=False)
        
        # Sheet untuk gabungan
        combined_df = all_composition_df[all_composition_df['Sheet'] == 'ALL_COMBINED']
        if not combined_df.empty:
            combined_df.to_excel(writer, sheet_name='Comp_ALL_COMBINED', index=False)
        
        # Sheet ringkasan per metode dan metrik
        summary_by_method = all_composition_df.groupby(['Sheet', 'Method', 'Metric']).agg({
            'Return (%)': 'mean',
            'Risk (%)': 'mean',
            'Sharpe': 'mean',
            'Sortino': 'mean',
            'Omega': 'mean'
        }).round(4).reset_index()
        summary_by_method.to_excel(writer, sheet_name='Summary_By_Method', index=False)
        
        # Sheet ringkasan quantile
        summary_by_quantile = all_composition_df.groupby(['Sheet', 'Method', 'Metric', 'Quantile']).agg({
            'Return (%)': 'mean',
            'Risk (%)': 'mean',
            'Sharpe': 'mean',
            'Sortino': 'mean',
            'Omega': 'mean'
        }).round(4).reset_index()
        summary_by_quantile.to_excel(writer, sheet_name='Summary_By_Quantile', index=False)
    
    print(f"   Portfolio composition saved to '{excel_filename}'")
    
    # ===============================
    # 9. SUMMARY TABLE - BEST PORTFOLIOS
    # ===============================
    
    print(f"\n{'='*80}")
    print("SUMMARY TABLE - BEST PORTFOLIOS BY METRIC")
    print(f"{'='*80}")
    
    summary_data = []
    for results in all_results:
        sheet_name = results['sheet_name']
        
        if results['mv_sharpe_points']:
            best_sharpe = max(results['mv_sharpe_points'], key=lambda x: x['target_value'])
            best_sortino = max(results['mv_sortino_points'], key=lambda x: x['target_value'])
            best_omega = max(results['mv_omega_points'], key=lambda x: x['target_value'])
            
            summary_data.append({
                'Sheet': sheet_name,
                'Assets': results['n_assets'],
                'Best Sharpe': f"{best_sharpe['target_value']:.4f}",
                'Best Sortino': f"{best_sortino['target_value']:.4f}",
                'Best Omega': f"{best_omega['target_value']:.2f}",
                'MVP Return': f"{results['mvp_ret']:.2f}%",
                'MVP Risk': f"{results['mvp_risk']:.2f}%",
                'Max Return': f"{results['max_return']:.2f}%",
                'Max Risk': f"{results['max_risk']:.2f}%"
            })
    
    df_summary = pd.DataFrame(summary_data)
    print(df_summary.to_string(index=False))
    
    summary_filename = get_unique_filename('summary_comparison.xlsx')
    df_summary.to_excel(summary_filename, index=False)
    print(f"\nSummary saved to '{summary_filename}'")
    
    # ===============================
    # 10. 5-POINTS ANALYSIS
    # ===============================
    
    print(f"\n{'='*80}")
    print("5-POINTS ANALYSIS")
    print(f"{'='*80}")
    
    all_5points_data = []
    for results in all_results:
        sheet_name = results['sheet_name']
        for p in results['mv_sharpe_points']:
            all_5points_data.append({
                'Sheet': sheet_name,
                'Metric': 'Sharpe',
                'Quantile': p['label'],
                'Value': p['target_value'],
                'Return (%)': p['portfolio']['return'],
                'Risk (%)': p['portfolio']['risk']
            })
        for p in results['mv_sortino_points']:
            all_5points_data.append({
                'Sheet': sheet_name,
                'Metric': 'Sortino',
                'Quantile': p['label'],
                'Value': p['target_value'],
                'Return (%)': p['portfolio']['return'],
                'Risk (%)': p['portfolio']['risk']
            })
        for p in results['mv_omega_points']:
            all_5points_data.append({
                'Sheet': sheet_name,
                'Metric': 'Omega',
                'Quantile': p['label'],
                'Value': p['target_value'],
                'Return (%)': p['portfolio']['return'],
                'Risk (%)': p['portfolio']['risk']
            })
    
    df_5points = pd.DataFrame(all_5points_data)
    df_5points = df_5points.round({
        'Value': 4,
        'Return (%)': 2,
        'Risk (%)': 2
    })
    
    # Pivot untuk setiap metrik
    points_filename = get_unique_filename('5points_all_sheets.xlsx')
    with pd.ExcelWriter(points_filename) as writer:
        for metric in ['Sharpe', 'Sortino', 'Omega']:
            pivot = df_5points[df_5points['Metric'] == metric].pivot_table(
                index='Sheet', columns='Quantile', values='Value'
            )
            pivot.to_excel(writer, sheet_name=f'{metric}_Ratio')
    
    print(f"5-points analysis saved to '{points_filename}'")
    
    print(f"\n{'='*80}")
    print("ANALYSIS COMPLETE!")
    print(f"{'='*80}")
    print("\nGenerated files:")
    print(f"   - plot_[sheet_name].png (with auto-rename if exists)")
    print(f"   - plot_ALL_COMBINED.png (with auto-rename if exists)")
    print(f"   - plot_comparison_all.png (with auto-rename if exists)")
    print(f"   - {excel_filename} (portfolio composition tables)")
    print(f"   - {summary_filename} (best portfolios summary)")
    print(f"   - {points_filename} (5-points analysis)")

if __name__ == "__main__":
    main()
