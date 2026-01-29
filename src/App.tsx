import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Search, FileText, LogOut, X } from 'lucide-react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from './lib/firebase';
import { formatINR, formatUSD } from './lib/utils';
import { PinLogin, isAuthenticated, logout } from './components/PinLogin';

const queryClient = new QueryClient();

interface OpsCost {
  opsNo: string;
  buyerName: string;
  buyerCode: string;
  poValue: number;
  materialPurchase: number;
  dyeing: number;
  weaving: number;
  finishing: number;
  rework: number;
  packingLabels: number;
  shipping: number;
  updatedAt?: string;
}

interface OpsFromOrders {
  id: string;
  opsNo: string;
  buyerName: string;
  buyerCode: string;
  poValue?: number;
  poNumber?: string;
  totalPcs?: number;
  totalSqm?: number;
  shipDate?: string;
  orderConfirmationDate?: string;
  merchantCode?: string;
  status?: string;
}

const EMPTY_COST: Omit<OpsCost, 'opsNo' | 'buyerName' | 'buyerCode' | 'poValue'> = {
  materialPurchase: 0,
  dyeing: 0,
  weaving: 0,
  finishing: 0,
  rework: 0,
  packingLabels: 0,
  shipping: 0,
};

function AppContent() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [costs, setCosts] = useState<OpsCost[]>([]);
  const [opsMap, setOpsMap] = useState<Map<string, OpsFromOrders>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOps, setSelectedOps] = useState<OpsFromOrders | null>(null);

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load existing costs
      const costsSnapshot = await getDocs(collection(db, COLLECTIONS.OPS_COSTS));
      const costsMap = new Map<string, any>();
      costsSnapshot.docs.forEach(doc => {
        costsMap.set(doc.id, doc.data());
      });

      // Load ALL OPS from orders (regardless of status)
      const opsSnapshot = await getDocs(collection(db, COLLECTIONS.OPS_NO));
      const opsData = opsSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as OpsFromOrders[];

      // Store OPS data in a map for quick lookup
      const opsDataMap = new Map<string, OpsFromOrders>();
      opsData.forEach(ops => opsDataMap.set(ops.opsNo, ops));
      setOpsMap(opsDataMap);

      // Merge OPS with their costs (if any)
      const mergedCosts: OpsCost[] = opsData.map(ops => {
        const existingCost = costsMap.get(ops.opsNo);
        return {
          ...EMPTY_COST,
          opsNo: ops.opsNo,
          buyerName: ops.buyerName || '',
          buyerCode: ops.buyerCode || '',
          poValue: ops.poValue || 0,
          ...existingCost, // Override with saved costs if they exist
        };
      });

      // Sort by OPS number descending (newest first)
      mergedCosts.sort((a, b) => b.opsNo.localeCompare(a.opsNo));
      setCosts(mergedCosts);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  // Load data on mount (must be before any conditional returns)
  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  if (!authenticated) {
    return <PinLogin onSuccess={() => setAuthenticated(true)} />;
  }

  const handleCostChange = (opsNo: string, field: keyof OpsCost, value: number) => {
    setCosts(prev => prev.map(cost =>
      cost.opsNo === opsNo ? { ...cost, [field]: value } : cost
    ));
  };

  const saveCost = async (cost: OpsCost) => {
    setSaving(cost.opsNo);
    try {
      const totalCost =
        cost.materialPurchase + cost.dyeing + cost.weaving +
        cost.finishing + cost.rework + cost.packingLabels + cost.shipping;

      const margin = cost.poValue > 0 ? cost.poValue - totalCost : 0;
      const marginPercent = cost.poValue > 0 ? (margin / cost.poValue) * 100 : 0;

      await setDoc(doc(db, COLLECTIONS.OPS_COSTS, cost.opsNo), {
        ...cost,
        totalCost,
        margin,
        marginPercent,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving:', error);
    }
    setSaving(null);
  };


  const hasCosts = (cost: OpsCost) => {
    return cost.materialPurchase > 0 || cost.dyeing > 0 || cost.weaving > 0 ||
           cost.finishing > 0 || cost.rework > 0 || cost.packingLabels > 0 || cost.shipping > 0;
  };

  const filteredCosts = costs.filter(cost =>
    !searchTerm ||
    cost.opsNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cost.buyerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total costs
  const totalCosts = costs.reduce((sum, c) =>
    sum + c.materialPurchase + c.dyeing + c.weaving + c.finishing + c.rework + c.packingLabels + c.shipping, 0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold">OPS Cost Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">{formatINR(totalCosts)}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-[1400px] mx-auto px-4 py-2">
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg"
          />
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOps && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOps(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">{selectedOps.opsNo}</h2>
              <button
                onClick={() => setSelectedOps(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Buyer</p>
                  <p className="font-semibold text-gray-900">{selectedOps.buyerName || '-'}</p>
                  <p className="text-sm text-gray-500">{selectedOps.buyerCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">PO Number</p>
                  <p className="font-semibold text-gray-900">{selectedOps.poNumber || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">PO Value</p>
                  <p className="font-semibold text-gray-900">
                    {selectedOps.poValue ? formatUSD(selectedOps.poValue) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    selectedOps.status === 'shipped' ? 'bg-green-100 text-green-700' :
                    selectedOps.status === 'in_production' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedOps.status || 'open'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Pcs</p>
                  <p className="font-semibold text-gray-900">{selectedOps.totalPcs || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total SQM</p>
                  <p className="font-semibold text-gray-900">
                    {selectedOps.totalSqm ? selectedOps.totalSqm.toFixed(2) : '-'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Ship Date</p>
                  <p className="font-semibold text-gray-900">{selectedOps.shipDate || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Merchant</p>
                  <p className="font-semibold text-gray-900">{selectedOps.merchantCode || '-'}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 rounded-b-xl border-t">
              <button
                onClick={() => setSelectedOps(null)}
                className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-w-[1400px] mx-auto px-4 pb-4">
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-3 py-2 text-left font-semibold sticky left-0 bg-gray-100 w-[130px]">OPS No</th>
                <th className="px-2 py-2 text-center font-semibold w-[100px] bg-blue-50">Material</th>
                <th className="px-2 py-2 text-center font-semibold w-[100px] bg-purple-50">Dyeing</th>
                <th className="px-2 py-2 text-center font-semibold w-[100px] bg-green-50">Weaving</th>
                <th className="px-2 py-2 text-center font-semibold w-[100px] bg-yellow-50">Finishing</th>
                <th className="px-2 py-2 text-center font-semibold w-[100px] bg-red-50">Rework</th>
                <th className="px-2 py-2 text-center font-semibold w-[100px] bg-cyan-50">Packing</th>
                <th className="px-2 py-2 text-center font-semibold w-[100px] bg-pink-50">Shipping</th>
                <th className="px-3 py-2 text-right font-semibold w-[110px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredCosts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredCosts.map((cost) => {
                  const totalCost =
                    cost.materialPurchase + cost.dyeing + cost.weaving +
                    cost.finishing + cost.rework + cost.packingLabels + cost.shipping;
                  const hasAnyCost = hasCosts(cost);

                  return (
                    <tr key={cost.opsNo} className={`border-b hover:bg-gray-50 ${!hasAnyCost ? 'bg-orange-50/30' : ''}`}>
                      <td className={`px-3 py-1 font-medium sticky left-0 ${!hasAnyCost ? 'bg-orange-50/30' : 'bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasAnyCost ? 'bg-green-500' : 'bg-orange-400'}`} />
                          <button
                            onClick={() => setSelectedOps(opsMap.get(cost.opsNo) || null)}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
                          >
                            {cost.opsNo}
                          </button>
                          {saving === cost.opsNo && (
                            <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </td>
                      <CostCell cost={cost} field="materialPurchase" onChange={handleCostChange} onSave={saveCost} bgColor="bg-blue-50/50" />
                      <CostCell cost={cost} field="dyeing" onChange={handleCostChange} onSave={saveCost} bgColor="bg-purple-50/50" />
                      <CostCell cost={cost} field="weaving" onChange={handleCostChange} onSave={saveCost} bgColor="bg-green-50/50" />
                      <CostCell cost={cost} field="finishing" onChange={handleCostChange} onSave={saveCost} bgColor="bg-yellow-50/50" />
                      <CostCell cost={cost} field="rework" onChange={handleCostChange} onSave={saveCost} bgColor="bg-red-50/50" />
                      <CostCell cost={cost} field="packingLabels" onChange={handleCostChange} onSave={saveCost} bgColor="bg-cyan-50/50" />
                      <CostCell cost={cost} field="shipping" onChange={handleCostChange} onSave={saveCost} bgColor="bg-pink-50/50" />
                      <td className="px-3 py-1 text-right font-semibold text-sm">
                        {totalCost > 0 ? formatINR(totalCost) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CostCell({
  cost,
  field,
  onChange,
  onSave,
  bgColor
}: {
  cost: OpsCost;
  field: keyof OpsCost;
  onChange: (opsNo: string, field: keyof OpsCost, value: number) => void;
  onSave: (cost: OpsCost) => void;
  bgColor: string;
}) {
  const value = cost[field] as number;

  return (
    <td className={`px-1 py-1 ${bgColor}`}>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(cost.opsNo, field, Number(e.target.value) || 0)}
        onBlur={() => onSave(cost)}
        className="w-full px-2 py-1 text-right text-sm border rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="0"
      />
    </td>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
