import sys
import json
import os
import random
import warnings
import numpy as np
import pandas as pd
from scipy.optimize import minimize

warnings.filterwarnings('ignore')

# ===============================
# METRICS & PERFORMANCE FUNCTIONS
# ===============================

def portfolio_performance(weights, mean_returns, cov_matrix):
    """Return dan Volatility tahunan dalam persen (%)"""
    returns = float(np.dot(weights, mean_returns) * 100)
    variance = float(np.dot(weights.T, np.dot(cov_matrix, weights)))
    volatility = float(np.sqrt(max(0.0, variance)) * 100)
    return returns, volatility

def calculate_sharpe(weights, mean_returns, cov_matrix, risk_free_rate=0.0):
    """Sharpe Ratio Tahunan"""
    ret, risk = portfolio_performance(weights, mean_returns, cov_matrix)
    if risk > 0:
        return float((ret - risk_free_rate) / risk)
    return 0.0

def calculate_sortino(weights, daily_returns_matrix, risk_free_rate=0.0):
    """Sortino Ratio Tahunan"""
    portfolio_daily_returns = np.dot(daily_returns_matrix, weights)
    rf_daily = risk_free_rate / (100.0 * 252.0)
    
    excess_return_daily = np.mean(portfolio_daily_returns) - rf_daily
    excess_return_annual = excess_return_daily * 252.0 * 100.0
    
    downside_returns = portfolio_daily_returns[portfolio_daily_returns < rf_daily] - rf_daily
    if len(downside_returns) > 0:
        downside_deviation = np.sqrt(np.mean(downside_returns**2))
        downside_deviation_annual = downside_deviation * np.sqrt(252.0) * 100.0
    else:
        downside_deviation_annual = 0.0001
        
    if downside_deviation_annual > 0:
        return float(excess_return_annual / downside_deviation_annual)
    return 0.0

def calculate_omega(weights, daily_returns_matrix, threshold=0.0):
    """Omega Ratio"""
    portfolio_daily_returns = np.dot(daily_returns_matrix, weights)
    annual_returns = portfolio_daily_returns * 252.0 * 100.0
    
    gains = annual_returns[annual_returns > threshold] - threshold
    losses = threshold - annual_returns[annual_returns < threshold]
    
    sum_losses = np.sum(losses)
    if sum_losses == 0:
        return 999.0
    return float(np.sum(gains) / sum_losses)

def portfolio_metrics(weights, mean_returns, cov_matrix, daily_returns_matrix, tickers, risk_free_rate=0.0):
    """Hitung seluruh metrik untuk sebuah kombinasi portofolio"""
    ret, risk = portfolio_performance(weights, mean_returns, cov_matrix)
    w_list = [float(w) for w in weights]
    weights_dict = {ticker: round(float(w), 4) for ticker, w in zip(tickers, w_list)}
    
    return {
        'return': round(ret, 4),
        'risk': round(risk, 4),
        'sharpe': round(calculate_sharpe(weights, mean_returns, cov_matrix, risk_free_rate), 4),
        'sortino': round(calculate_sortino(weights, daily_returns_matrix, risk_free_rate), 4),
        'omega': round(calculate_omega(weights, daily_returns_matrix, threshold=0.0), 4),
        'weights': weights_dict,
        'weights_raw': w_list
    }

# ===============================
# MARKOWITZ SLSQP OPTIMIZATION
# ===============================

def get_minimum_variance_portfolio(mean_returns, cov_matrix, n_assets):
    """Global Minimum Variance Portfolio (MVP)"""
    def objective(weights):
        return portfolio_performance(weights, mean_returns, cov_matrix)[1]
    
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
    bounds = tuple((0.0, 1.0) for _ in range(n_assets))
    initial = np.array([1.0 / n_assets] * n_assets)
    
    result = minimize(objective, initial, method='SLSQP', bounds=bounds, constraints=constraints)
    if result.success:
        ret, risk = portfolio_performance(result.x, mean_returns, cov_matrix)
        return result.x, (ret, risk)
    return None, (None, None)

def get_max_return_portfolio(mean_returns, n_assets):
    """Portofolio dengan Expected Return Tertinggi"""
    max_ret_asset = int(np.argmax(mean_returns))
    w = np.zeros(n_assets)
    w[max_ret_asset] = 1.0
    return w

def get_efficient_frontier(mean_returns, cov_matrix, daily_returns_matrix, tickers, n_assets, risk_free_rate=0.0, n_points=50):
    """Kurva Markowitz Efficient Frontier"""
    mvp_weights, (mvp_return, mvp_risk) = get_minimum_variance_portfolio(mean_returns, cov_matrix, n_assets)
    if mvp_weights is None:
        return [], None, None, None, None
    
    max_ret_weights = get_max_return_portfolio(mean_returns, n_assets)
    max_return, max_risk = portfolio_performance(max_ret_weights, mean_returns, cov_matrix)
    
    if max_return <= mvp_return:
        target_returns = [mvp_return]
    else:
        target_returns = np.linspace(mvp_return, max_return, n_points)
    
    def minimize_volatility(target_return):
        def objective(weights):
            return portfolio_performance(weights, mean_returns, cov_matrix)[1]
        
        constraints = (
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
            {'type': 'eq', 'fun': lambda w: np.dot(w, mean_returns) * 100.0 - target_return}
        )
        bounds = tuple((0.0, 1.0) for _ in range(n_assets))
        initial = mvp_weights.copy()
        
        try:
            result = minimize(objective, initial, method='SLSQP', bounds=bounds, constraints=constraints)
            if result.success:
                return result.x
            return None
        except:
            return None
    
    frontier_points = []
    for r in target_returns:
        w = minimize_volatility(r)
        if w is not None:
            pm = portfolio_metrics(w, mean_returns, cov_matrix, daily_returns_matrix, tickers, risk_free_rate)
            frontier_points.append(pm)
            
    return frontier_points, mvp_weights, (mvp_return, mvp_risk), max_ret_weights, (max_return, max_risk)

# ===============================
# TRUE NSGA-II ALGORITHM
# ===============================

def nsga_generate_portfolios(mean_returns, cov_matrix, daily_returns_matrix, tickers, n_assets,
                             mvp_return, max_return, risk_free_rate=0.0,
                             pop_size=200, generations=100, crossover_rate=0.9, mutation_rate=0.1):
    """NSGA-II dengan Pareto Non-dominated Sorting"""
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

    for _ in range(generations):
        offspring = []
        while len(offspring) < pop_size:
            p1_idx, p2_idx = random.sample(range(len(population)), 2)
            p1, p2 = population[p1_idx], population[p2_idx]
            
            if random.random() < crossover_rate:
                mask = np.random.rand(n_assets) < 0.5
                child = np.where(mask, p1, p2)
            else:
                child = p1.copy()
            
            if random.random() < mutation_rate:
                m_idx = random.randint(0, n_assets - 1)
                child[m_idx] = random.random()
            
            s = np.sum(child)
            if s > 0:
                child = child / s
                offspring.append(child)
            else:
                offspring.append(p1.copy())
                
        combined_population = np.vstack([population, np.array(offspring)])
        
        combined_metrics = []
        for ind in combined_population:
            ret, _ = portfolio_performance(ind, mean_returns, cov_matrix)
            pm = portfolio_metrics(ind, mean_returns, cov_matrix, daily_returns_matrix, tickers, risk_free_rate)
            if ret < mvp_return:
                pm['return'] = mvp_return - 1000.0 * (mvp_return - ret)
            elif ret > max_return:
                pm['return'] = max_return - 1000.0 * (ret - max_return)
            combined_metrics.append(pm)
            
        total_2n = len(combined_population)
        domination_count = np.zeros(total_2n)
        dominated_by = [[] for _ in range(total_2n)]
        
        for i in range(total_2n):
            for j in range(total_2n):
                if i != j:
                    if dominates(combined_metrics[i], combined_metrics[j]):
                        dominated_by[i].append(j)
                    elif dominates(combined_metrics[j], combined_metrics[i]):
                        domination_count[i] += 1
        
        fronts = []
        remaining = set(range(total_2n))
        while remaining:
            front = [i for i in remaining if domination_count[i] == 0]
            if not front:
                break
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
                front_metrics = [combined_metrics[i] for i in front]
                distances = crowding_distance(front_metrics)
                sorted_front = [front[i] for i in np.argsort(distances)[::-1]]
                needed = pop_size - len(selected)
                selected.extend(sorted_front[:needed])
                break
                
        if len(selected) < pop_size:
            extra = [i for i in range(total_2n) if i not in selected]
            selected.extend(extra[:pop_size - len(selected)])
            
        population = combined_population[selected]

    final_metrics = []
    for ind in population:
        ret, _ = portfolio_performance(ind, mean_returns, cov_matrix)
        if (mvp_return - 0.05) <= ret <= (max_return + 0.05):
            final_metrics.append(portfolio_metrics(ind, mean_returns, cov_matrix, daily_returns_matrix, tickers, risk_free_rate))
    
    return final_metrics

def get_5_points_by_metric(metrics_list, metric_name):
    """Mendapatkan 5 titik quantile berdasarkan metrik tertentu (Min, Q1, Median, Q3, Max)"""
    if not metrics_list:
        return []
    
    values = [m[metric_name] for m in metrics_list]
    min_val = float(np.min(values))
    q1_val = float(np.percentile(values, 25))
    median_val = float(np.percentile(values, 50))
    q3_val = float(np.percentile(values, 75))
    max_val = float(np.max(values))
    
    points = []
    for target_val, label in [(min_val, 'Min'), (q1_val, 'Q1'), (median_val, 'Median'), 
                               (q3_val, 'Q3'), (max_val, 'Max')]:
        idx = int(np.argmin([abs(m[metric_name] - target_val) for m in metrics_list]))
        points.append({
            'label': label,
            'target_value': round(target_val, 4),
            'portfolio': metrics_list[idx],
            'index': idx
        })
    return points

# ===============================
# EXPORTED FUNCTION (FOR WSGI & CLI)
# ===============================

def run_optimization(input_data):
    """Fungsi utama yang menerima dictionary Python dan mengembalikan hasil optimasi"""
    tickers = input_data.get('tickers', [])
    prices_dict = input_data.get('prices', {})
    initial_capital = float(input_data.get('initial_capital', 10000000))
    risk_free_rate = float(input_data.get('risk_free_rate', 6.0))
    nsga_params = input_data.get('nsga_params', {})
    
    pop_size = int(nsga_params.get('population_size', 200))
    generations = int(nsga_params.get('generations', 100))
    crossover_rate = float(nsga_params.get('crossover_rate', 0.9))
    mutation_rate = float(nsga_params.get('mutation_rate', 0.1))

    if len(tickers) < 2:
        raise ValueError("Minimal 2 tickers required for portfolio optimization.")
    
    df_raw = pd.DataFrame(prices_dict)
    
    missing_tickers = [t for t in tickers if t not in df_raw.columns]
    if missing_tickers:
        raise ValueError(f"Data harga tidak lengkap untuk ticker: {missing_tickers}")
        
    df_prices = df_raw[tickers].copy()
    df_prices.sort_index(inplace=True)
    df_prices = df_prices.dropna()
    
    if len(df_prices) < 5:
        raise ValueError(f"Data harga historis tidak mencukupi ({len(df_prices)} hari bursa ditemukan).")
    
    daily_returns = df_prices.pct_change().dropna()
    n_assets = len(tickers)
    
    mean_returns = daily_returns.mean().values * 252.0
    cov_matrix = daily_returns.cov().values * 252.0
    daily_returns_matrix = daily_returns.values
    
    frontier_points, mvp_w, (mvp_ret, mvp_risk), max_ret_w, (max_ret, max_risk) = get_efficient_frontier(
        mean_returns, cov_matrix, daily_returns_matrix, tickers, n_assets, risk_free_rate
    )
    
    if mvp_w is None:
        raise ValueError("Gagal menghitung Global Minimum Variance Portfolio.")
    
    nsga_portfolios = nsga_generate_portfolios(
        mean_returns, cov_matrix, daily_returns_matrix, tickers, n_assets,
        mvp_ret, max_ret, risk_free_rate,
        pop_size=pop_size, generations=generations,
        crossover_rate=crossover_rate, mutation_rate=mutation_rate
    )
    
    all_candidate_portfolios = frontier_points + nsga_portfolios
    
    mvp_portfolio = portfolio_metrics(mvp_w, mean_returns, cov_matrix, daily_returns_matrix, tickers, risk_free_rate)
    max_ret_portfolio = portfolio_metrics(max_ret_w, mean_returns, cov_matrix, daily_returns_matrix, tickers, risk_free_rate)
    
    best_sharpe_portfolio = max(all_candidate_portfolios, key=lambda x: x['sharpe'])
    best_sortino_portfolio = max(all_candidate_portfolios, key=lambda x: x['sortino'])
    best_omega_portfolio = max(all_candidate_portfolios, key=lambda x: x['omega'])
    
    individual_assets = []
    for i, ticker in enumerate(tickers):
        w = np.zeros(n_assets)
        w[i] = 1.0
        pm = portfolio_metrics(w, mean_returns, cov_matrix, daily_returns_matrix, tickers, risk_free_rate)
        pm['ticker'] = ticker
        individual_assets.append(pm)
        
    sharpe_5points = get_5_points_by_metric(all_candidate_portfolios, 'sharpe')
    sortino_5points = get_5_points_by_metric(all_candidate_portfolios, 'sortino')
    omega_5points = get_5_points_by_metric(all_candidate_portfolios, 'omega')
    
    def attach_capital_allocation(port):
        allocation = {}
        for t, w in port['weights'].items():
            nominal = round(w * initial_capital, 2)
            latest_p = float(df_prices[t].iloc[-1]) if t in df_prices else 1.0
            shares = int(nominal // latest_p) if latest_p > 0 else 0
            lots = int(shares // 100)
            
            allocation[t] = {
                'weight_percent': round(w * 100.0, 2),
                'nominal_idr': nominal,
                'latest_price': latest_p,
                'estimated_shares': shares,
                'estimated_lots': lots
            }
        port['capital_allocation'] = allocation
        return port

    return {
        'status': 'success',
        'summary': {
            'total_assets': n_assets,
            'tickers': tickers,
            'data_points_days': len(df_prices),
            'initial_capital': initial_capital,
            'risk_free_rate': risk_free_rate,
            'nsga_params': {
                'population_size': pop_size,
                'generations': generations,
                'crossover_rate': crossover_rate,
                'mutation_rate': mutation_rate
            }
        },
        'best_portfolios': {
            'sharpe': attach_capital_allocation(best_sharpe_portfolio),
            'sortino': attach_capital_allocation(best_sortino_portfolio),
            'omega': attach_capital_allocation(best_omega_portfolio),
            'min_variance': attach_capital_allocation(mvp_portfolio),
            'max_return': attach_capital_allocation(max_ret_portfolio)
        },
        'individual_assets': individual_assets,
        'efficient_frontier': frontier_points,
        'nsga_pareto_samples': nsga_portfolios[:80],
        'quantile_analysis': {
            'sharpe': sharpe_5points,
            'sortino': sortino_5points,
            'omega': omega_5points
        }
    }

if __name__ == '__main__':
    try:
        if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
            with open(sys.argv[1], 'r', encoding='utf-8') as f:
                input_data = json.load(f)
        else:
            input_str = sys.stdin.read()
            if not input_str:
                raise ValueError("No input data provided")
            input_data = json.loads(input_str)
            
        result = run_optimization(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'status': 'error', 'message': str(e)}))
        sys.exit(1)