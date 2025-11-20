import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import { listOrders } from '../services/listServices';

const orderStates = {
  ALL: '',
  PENDIENTE: 'pending',
  PROCESADO: 'processing',
  ENVIADO: 'shipped',
  ENTREGADO: 'delivered',
  CANCELADO: 'cancelled',
  DEVUELTO: 'returned',
};

const getFirst = (obj, keys) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return undefined;
};

const extractItems = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.orders ?? data.items ?? data.orderItems ?? [];
};

const extractTotal = (data, items) => {
  if (!data) return items.length;
  return data.total ?? data.totalItems ?? data.count ?? items.length;
};

function ListOrdersPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState(orderStates.ALL);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const resolveOrderNumber = (order) => getFirst(order, ['orderNumber,', 'number', 'id', 'orderId']) ?? '-';
  const resolveClientName = (order) => getFirst(order, ['customerName', 'clientName', 'buyerName', 'name']) ?? '-';
  const resolveStatus = (order) => getFirst(order, ['status', 'orderStatus', 'state']) ?? '-';

  const fetch = async (page = pageNumber) => {
    try {
      setLoading(true);
      const { data, error } = await listOrders({ search: searchTerm, status, pageNumber: page, pageSize });
      console.log('listOrders response:', data);
      if (error) throw error;

      const items = extractItems(data);

      const q = (searchTerm || '').trim();
      let filtered = items;

      const isLikelyId = /^[0-9a-fA-F-]{8,}$/.test(q);

      if (q.length > 0) {
        if (isLikelyId) {
          filtered = items.filter(o => String(o.id) === q);
        } else {
          filtered = items.filter(o => {
            const num = resolveOrderNumber(o);
            return String(num).toLowerCase().includes(q.toLowerCase())
              || String(o.id ?? '').toLowerCase().includes(q.toLowerCase());
          });
        }
      }

      setOrders(filtered);
      setTotal(filtered.length);
      setPageNumber(page);
    } catch (err) {
      console.error('fetch orders error', err);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(pageNumber);
  }, [status, pageNumber, pageSize]);

  const handleSearch = async () => {
    await fetch(1);
  };

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl">Ordenes</h1>
          <Button onClick={() => navigate('/admin/orders/create')}>Crear Orden</Button>
        </div>

        {/* Barra de búsqueda dentro del Card */}
        <div className="mt-4">
          <Card className="p-4 border border-gray-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  type="text"
                  placeholder="Buscar órdenes..."
                  className="text-[1.1rem] w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <Button 
                className="h-11 w-11 rounded-lg" onClick={handleSearch}>
                🔍
                </Button>
              </div>

              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPageNumber(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value={orderStates.ALL}>Todos</option>
                <option value={orderStates.PENDIENTE}>Pendientes</option>
                <option value={orderStates.PROCESADO}>En proceso</option>
                <option value={orderStates.ENVIADO}>Enviadas</option>
                <option value={orderStates.ENTREGADO}>Entregadas</option> 
                <option value={orderStates.CANCELADO}>Canceladas</option>
                <option value={orderStates.DEVUELTO}>Devueltas</option>
              </select>
            </div>
          </Card>
        </div>
      </Card>

      <div className="mt-4 flex flex-col gap-4">
        {loading ? (
          <span>Buscando datos...</span>
        ) : orders.length === 0 ? (
          <span>No hay órdenes</span>
        ) : (
          orders.map((order) => (
            <Card
              key={order.id ?? resolveOrderNumber(order)}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">
                    #{resolveOrderNumber(order)} - {resolveClientName(order)}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {order.email ?? order.contactEmail ?? ''}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm">{resolveStatus(order)}</p>
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={() =>
                        navigate(`/admin/orders/${order.id ?? resolveOrderNumber(order)}`)
                      }
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-center items-center mt-3 gap-3">
        <button
          disabled={pageNumber === 1}
          onClick={() => fetch(Math.max(1, pageNumber - 1))}
          className="bg-gray-200 disabled:bg-gray-100 px-3 py-1"
        >
          Atras
        </button>

        <span>{pageNumber} / {totalPages}</span>

        <button
          disabled={pageNumber === totalPages}
          onClick={() => fetch(Math.min(totalPages, pageNumber + 1))}
          className="bg-gray-200 disabled:bg-gray-100 px-3 py-1"
        >
          Siguiente
        </button>

        <select
          value={pageSize}
          onChange={(evt) => { setPageNumber(1); setPageSize(Number(evt.target.value)); }}
          className="ml-3 border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
      </div>
    </div>
  );
}

export default ListOrdersPage;