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

function ListOrdersPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState(orderStates.ALL);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);     // total real de órdenes
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const resolveOrderNumber = (order) =>
    order.orderNumber ?? order.number ?? order.id ?? '-';

  const resolveClientName = (order) =>
    order.customerName ?? order.clientName ?? order.buyerName ?? order.name ?? '-';

  const resolveStatus = (order) =>
    order.status ?? order.orderStatus ?? order.state ?? '-';

  // Obtiene SOLO la página solicitada
  const fetchPage = async (page = pageNumber) => {
    try {
      setLoading(true);

      const { data, error } = await listOrders({
        search: searchTerm,
        status,
        pageNumber: page,
        pageSize,
      });

      console.log("listOrders response:", data);

      if (error) throw error;

      // El backend devuelve un array directo
      setOrders(data);

      // Si no sabemos el total, lo pedimos 1 vez al iniciar
      if (page === 1 && total === 0) {
        setTotal(
          typeof data.total === 'number'
            ? data.total
            : data.length < pageSize
              ? data.length
              : data.length * 2 // fallback estimado
        );
      }

      setPageNumber(page);
    } catch (err) {
      console.error("fetch orders error", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(pageNumber);
  }, [status, pageSize, pageNumber]);

  const handleSearch = () => {
    setPageNumber(1);
    fetchPage(1);
  };

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl">Órdenes</h1>
          <Button onClick={() => navigate('/admin/orders/create')}>
            Crear Orden
          </Button>
        </div>

        {/* Buscador */}
        <div className="mt-4">
          <Card className="p-4 border border-gray-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  type="text"
                  placeholder="Buscar órdenes..."
                  className="text-[1.1rem] w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <Button className="h-11 w-11 rounded-lg" onClick={handleSearch}>
                  🔍
                </Button>
              </div>

              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPageNumber(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="processing">En proceso</option>
                <option value="shipped">Enviadas</option>
                <option value="delivered">Entregadas</option>
                <option value="cancelled">Canceladas</option>
                <option value="returned">Devueltas</option>
              </select>
            </div>
          </Card>
        </div>
      </Card>

      {/* Lista */}
      <div className="mt-4 flex flex-col gap-4">
        {loading ? (
          <span>Buscando datos...</span>
        ) : orders.length === 0 ? (
          <span>No hay órdenes</span>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="p-4 border border-gray-200 rounded-lg">
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

                  <Button
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    Ver
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Paginación */}
      <div className="flex justify-center items-center mt-3 gap-3">
        <button
          disabled={pageNumber === 1}
          onClick={() => fetchPage(pageNumber - 1)}
          className="bg-gray-200 disabled:bg-gray-100 px-3 py-1"
        >
          Atrás
        </button>

        <span>{pageNumber} / {totalPages}</span>

        <button
          disabled={pageNumber === totalPages}
          onClick={() => fetchPage(pageNumber + 1)}
          className="bg-gray-200 disabled:bg-gray-100 px-3 py-1"
        >
          Siguiente
        </button>

        <select
          value={pageSize}
          onChange={(evt) => {
            setPageNumber(1);
            setPageSize(Number(evt.target.value));
          }}
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
