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

const BACKEND_PAGE_SIZE = 50;

function ListOrdersPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState(orderStates.ALL);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const resolveOrderNumber = (order) =>
    order.orderNumber ?? order.number ?? order.id ?? '-';

  const resolveClientName = (order) =>
    order.customerName ??
    order.clientName ??
    order.buyerName ??
    order.name ??
    '-';

  const resolveStatus = (order) =>
    order.status ?? order.orderStatus ?? order.state ?? '-';

  const fetchAllOrders = async () => {
    try {
      setLoading(true);

      let page = 1;
      let allOrders = [];

      while (true) {
        const { data, error } = await listOrders({
          status,       
          pageNumber: page,
          pageSize: BACKEND_PAGE_SIZE,
        });

        if (error) throw error;

        const currentPage = Array.isArray(data) ? data : [];

        allOrders = allOrders.concat(currentPage);

        if (currentPage.length < BACKEND_PAGE_SIZE) {
          break;
        }

        page += 1;
      }

      setOrders(allOrders);
      setPageNumber(1);
    } catch (err) {
      console.error('fetchAllOrders error', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [status]);



  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedFilterStatus = status ? status.toLowerCase() : '';

  const filteredOrders = orders.filter((order) => {
    const currentStatus =
      order.status ?? order.orderStatus ?? order.state ?? '';
    const normalizedCurrentStatus = String(currentStatus).toLowerCase();

    const matchesStatus =
      !normalizedFilterStatus || normalizedCurrentStatus === normalizedFilterStatus;
    if (!matchesStatus) return false;

    if (!normalizedSearch) return true;

    const orderNumber = String(resolveOrderNumber(order)).toLowerCase();
    const clientName = String(resolveClientName(order)).toLowerCase();
    const email = String(order.email ?? order.contactEmail ?? '').toLowerCase();

    return (
      orderNumber.includes(normalizedSearch) ||
      clientName.includes(normalizedSearch) ||
      email.includes(normalizedSearch)
    );
  });

  const total = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handleSearch = () => {
   
    setPageNumber(1);
  };

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl">Órdenes</h1>
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
                  placeholder="Buscar órdenes o por ID..."
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
        ) : paginatedOrders.length === 0 ? (
          <span>No hay órdenes</span>
        ) : (
          paginatedOrders.map((order, index) => {

            // Número visual (#1, #2, #3…) según la página
            const displayNumber = (pageNumber - 1) * pageSize + index + 1;

            return (
              <Card
                key={order.id}
                className="p-5 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex justify-between items-center">

                  {/* Izquierda: Nombre + ID + Email */}
                  <div className="flex flex-col">
                    
                    {/* Nombre del cliente + número visual */}
                    <h2 className="text-lg font-semibold text-gray-900">
                      #{displayNumber} — {resolveClientName(order)}
                    </h2>

                    {/* ID de orden */}
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium text-gray-700">
                        ID de orden:
                      </span>{" "}
                      {resolveOrderNumber(order)}
                    </p>

                    {/* Email */}
                    <p className="text-sm text-gray-600">
                      {order.email ?? order.contactEmail ?? '—'}
                    </p>
                  </div>

                  {/* Derecha: Estado + botón */}
                  <div className="flex flex-col items-end gap-2">

                    {/* Badge de estado */}
                    <span
                      className={`
                        text-sm px-3 py-1 rounded-full font-medium
                        ${
                          resolveStatus(order) === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : resolveStatus(order) === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : resolveStatus(order) === "shipped"
                            ? "bg-purple-100 text-purple-700"
                            : resolveStatus(order) === "delivered"
                            ? "bg-green-100 text-green-700"
                            : resolveStatus(order) === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : resolveStatus(order) === "returned"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-200 text-gray-700"
                        }
                      `}
                    >
                      {resolveStatus(order)}
                    </span>

                    
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Paginación */}
      <div className="flex justify-center items-center mt-3 gap-3">
        <Button
          disabled={pageNumber === 1}
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          className="bg-gray-200 disabled:bg-gray-100 px-3 py-1"
        >
          Atrás
        </Button>

        <span>{pageNumber} / {totalPages}</span>

        <Button
          disabled={pageNumber === totalPages}
          onClick={() =>
            setPageNumber((p) => Math.min(totalPages, p + 1))
          }
          className="bg-gray-200 disabled:bg-gray-100 px-3 py-1"
        >
          Siguiente
        </Button>

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