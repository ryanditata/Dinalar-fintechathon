<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortfolioOptimization;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OptimizationHistoryController extends Controller
{
    /**
     * Display a listing of portfolio optimization histories.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $sort = $request->input('sort', 'latest');

        // Statistics
        $todayCount = PortfolioOptimization::whereDate('created_at', today())->count();
        $totalCount = PortfolioOptimization::count();
        $avgCapital = PortfolioOptimization::avg('initial_capital') ?: 0;

        // Calculate Top Stock (most frequently analyzed ticker across all records)
        $allTickers = PortfolioOptimization::pluck('tickers');
        $tickerFrequency = [];
        foreach ($allTickers as $tList) {
            if (is_array($tList)) {
                foreach ($tList as $ticker) {
                    $cleanTicker = strtoupper(str_replace('.JK', '', trim($ticker)));
                    if (!empty($cleanTicker)) {
                        $tickerFrequency[$cleanTicker] = ($tickerFrequency[$cleanTicker] ?? 0) + 1;
                    }
                }
            }
        }
        arsort($tickerFrequency);
        $topStockTicker = !empty($tickerFrequency) ? array_key_first($tickerFrequency) : '-';
        $topStockCount = !empty($tickerFrequency) ? current($tickerFrequency) : 0;

        $statistics = [
            'today_optimizations_count' => $todayCount,
            'total_optimizations_count' => $totalCount,
            'avg_capital' => round($avgCapital),
            'top_stock' => [
                'ticker' => $topStockTicker,
                'count' => $topStockCount,
            ],
        ];

        // Query with filters
        $query = PortfolioOptimization::with('user');

        if (!empty($search)) {
            $trimmed = trim($search);
            $query->where(function ($q) use ($trimmed) {
                $q->where('title', 'like', "%{$trimmed}%")
                    ->orWhere('id', 'like', "%{$trimmed}%")
                    ->orWhere('tickers', 'like', "%{$trimmed}%")
                    ->orWhereHas('user', function ($uq) use ($trimmed) {
                        $uq->where('name', 'like', "%{$trimmed}%")
                            ->orWhere('email', 'like', "%{$trimmed}%");
                    });
            });
        }

        // Sorting
        switch ($sort) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'capital_desc':
                $query->orderBy('initial_capital', 'desc');
                break;
            case 'capital_asc':
                $query->orderBy('initial_capital', 'asc');
                break;
            case 'name_asc':
                $query->join('users', 'users.id', '=', 'portfolio_optimizations.user_id')
                    ->orderBy('users.name', 'asc')
                    ->select('portfolio_optimizations.*');
                break;
            case 'name_desc':
                $query->join('users', 'users.id', '=', 'portfolio_optimizations.user_id')
                    ->orderBy('users.name', 'desc')
                    ->select('portfolio_optimizations.*');
                break;
            case 'latest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $optimizations = $query->paginate(15)->withQueryString();

        return Inertia::render('admin/optimasi/index', [
            'optimizations' => $optimizations,
            'filters' => [
                'search' => $search,
                'sort' => $sort,
            ],
            'statistics' => $statistics,
        ]);
    }

    /**
     * Export optimization histories as a formatted Excel spreadsheet.
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $search = $request->input('search');
        $sort = $request->input('sort', 'latest');

        $query = PortfolioOptimization::with('user');

        if (!empty($search)) {
            $trimmed = trim($search);
            $query->where(function ($q) use ($trimmed) {
                $q->where('title', 'like', "%{$trimmed}%")
                    ->orWhere('id', 'like', "%{$trimmed}%")
                    ->orWhere('tickers', 'like', "%{$trimmed}%")
                    ->orWhereHas('user', function ($uq) use ($trimmed) {
                        $uq->where('name', 'like', "%{$trimmed}%")
                            ->orWhere('email', 'like', "%{$trimmed}%");
                    });
            });
        }

        switch ($sort) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'capital_desc':
                $query->orderBy('initial_capital', 'desc');
                break;
            case 'capital_asc':
                $query->orderBy('initial_capital', 'asc');
                break;
            case 'name_asc':
                $query->join('users', 'users.id', '=', 'portfolio_optimizations.user_id')
                    ->orderBy('users.name', 'asc')
                    ->select('portfolio_optimizations.*');
                break;
            case 'name_desc':
                $query->join('users', 'users.id', '=', 'portfolio_optimizations.user_id')
                    ->orderBy('users.name', 'desc')
                    ->select('portfolio_optimizations.*');
                break;
            case 'latest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $data = $query->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Riwayat Optimasi');

        // Set document metadata
        $spreadsheet->getProperties()
            ->setCreator('Dinalar Portfolio System')
            ->setLastModifiedBy('Admin Dinalar')
            ->setTitle('Laporan Riwayat Optimasi Portofolio')
            ->setSubject('Riwayat Optimasi Saham');

        // Title Header Block
        $sheet->setCellValue('A1', 'LAPORAN RIWAYAT OPTIMASI PORTOFOLIO - DINALAR');
        $sheet->mergeCells('A1:L1');
        $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true)->getColor()->setARGB('FF047857');
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        $sheet->setCellValue('A2', 'Diekspor pada: ' . Carbon::now()->translatedFormat('d F Y, H:i') . ' WIB | Total Data: ' . $data->count() . ' Sesi');
        $sheet->mergeCells('A2:L2');
        $sheet->getStyle('A2')->getFont()->setSize(10)->setItalic(true)->getColor()->setARGB('FF6B7280');

        // Table Column Headers
        $headers = [
            'A4' => 'No',
            'B4' => 'Kode Ref',
            'C4' => 'Nama Pengguna',
            'D4' => 'Email',
            'E4' => 'Modal Awal (Rp)',
            'F4' => 'Jml Saham',
            'G4' => 'Daftar Ticker Saham',
            'H4' => 'Return Ekspektasi',
            'I4' => 'Volatilitas / Risiko',
            'J4' => 'Sharpe Ratio',
            'K4' => 'Periode Data',
            'L4' => 'Tanggal & Waktu Sesi',
        ];

        foreach ($headers as $cell => $text) {
            $sheet->setCellValue($cell, $text);
        }

        // Header Style (Emerald background, white bold text)
        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size' => 10,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF047857'], // Emerald 700
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FF065F46'],
                ],
            ],
        ];
        $sheet->getStyle('A4:L4')->applyFromArray($headerStyle);
        $sheet->getRowDimension(4)->setRowHeight(28);

        // Data Rows
        $row = 5;
        foreach ($data as $index => $item) {
            $tickerArr = is_array($item->tickers) ? $item->tickers : [];
            $cleanTickers = array_map(fn($t) => strtoupper(str_replace('.JK', '', trim($t))), $tickerArr);
            $tickerStr = implode(', ', $cleanTickers);

            // Extract best portfolio metrics (Sharpe profile or first solution)
            $bestPorts = is_array($item->best_portfolios) ? $item->best_portfolios : [];
            $sharpeProfile = $bestPorts['sharpe'] ?? ($bestPorts['max_sharpe'] ?? (isset($bestPorts[0]) ? $bestPorts[0] : (is_array($bestPorts) && !empty($bestPorts) ? reset($bestPorts) : null)));

            $expReturnStr = '-';
            $volatilityStr = '-';
            $sharpeStr = '-';

            if ($sharpeProfile && is_array($sharpeProfile)) {
                $rawReturn = $sharpeProfile['return'] ?? ($sharpeProfile['expected_return'] ?? null);
                $rawRisk = $sharpeProfile['risk'] ?? ($sharpeProfile['volatility'] ?? null);
                $rawSharpe = $sharpeProfile['sharpe'] ?? ($sharpeProfile['sharpe_ratio'] ?? null);

                if ($rawReturn !== null) {
                    $expReturnStr = round((float) $rawReturn, 2) . '%';
                }
                if ($rawRisk !== null) {
                    $volatilityStr = round((float) $rawRisk, 2) . '%';
                }
                if ($rawSharpe !== null) {
                    $sharpeStr = round((float) $rawSharpe, 2);
                }
            }

            $startDateStr = $item->start_date ? Carbon::parse($item->start_date)->format('d/m/Y') : '-';
            $endDateStr = $item->end_date ? Carbon::parse($item->end_date)->format('d/m/Y') : '-';
            $periodStr = ($startDateStr !== '-' && $endDateStr !== '-') ? "{$startDateStr} s/d {$endDateStr}" : '-';

            $createdAtStr = $item->created_at ? Carbon::parse($item->created_at)->format('d/m/Y H:i') : '-';

            $sheet->setCellValue('A' . $row, $index + 1);
            $sheet->setCellValue('B' . $row, $item->reference_code ?: ('DNL' . $item->user_id . '-' . $item->id));
            $sheet->setCellValue('C' . $row, $item->user ? $item->user->name : ('User #' . $item->user_id));
            $sheet->setCellValue('D' . $row, $item->user ? $item->user->email : '-');
            $sheet->setCellValue('E' . $row, (float) ($item->initial_capital ?: 0));
            $sheet->setCellValue('F' . $row, count($cleanTickers));
            $sheet->setCellValue('G' . $row, $tickerStr);
            $sheet->setCellValue('H' . $row, $expReturnStr);
            $sheet->setCellValue('I' . $row, $volatilityStr);
            $sheet->setCellValue('J' . $row, $sharpeStr);
            $sheet->setCellValue('K' . $row, $periodStr);
            $sheet->setCellValue('L' . $row, $createdAtStr);

            // Row zebra background styling
            $isEven = ($row % 2 === 0);
            $rowFillColor = $isEven ? 'FFF9FAFB' : 'FFFFFFFF';

            $rowStyle = [
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => $rowFillColor],
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['argb' => 'FFE5E7EB'],
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'font' => [
                    'size' => 9.5,
                ],
            ];
            $sheet->getStyle("A{$row}:L{$row}")->applyFromArray($rowStyle);

            // Alignments and Number formats
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('"Rp "#,##0');
            $sheet->getStyle("E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("J{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("K{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("L{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $sheet->getRowDimension($row)->setRowHeight(22);
            $row++;
        }

        // Auto-fit column widths
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'Laporan_Riwayat_Optimasi_Dinalar_' . date('Ymd_His') . '.xlsx';

        return new StreamedResponse(
            function () use ($spreadsheet) {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            },
            200,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'max-age=0',
            ]
        );
    }

    /**
     * Delete an optimization history record.
     */
    public function destroy($id)
    {
        $optimization = PortfolioOptimization::findOrFail($id);
        $optimization->delete();

        return redirect()->back()->with('success', 'Riwayat optimasi portofolio berhasil dihapus.');
    }
}
