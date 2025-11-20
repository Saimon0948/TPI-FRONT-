import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import { getProducts } from '../services/list';

const productStatus = {
  ALL: 'all',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
};

function ListProductsPage() {
  const navigate = useNavigate();

  const getFirst = (obj, keys) => {
    for (const k of keys) {
      if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
    }
    return undefined;
  };

  const resolvePrice = (product) => {
    let p = getFirst(product, ['currentUnitPrice', 'unitPrice', 'price', 'priceAmount']);
    if (p && typeof p === 'object') {
      p = p.amount ?? p.value ?? p.price ?? undefined;
    }
    const n = Number(p);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  };

  const resolveStock = (product) => {
    const s = getFirst(product, ['stockQuantity', 'stock', 'quantity', 'stockLevel']);
    return (s === undefined || s === null || s === '') ? '0' : s;
  };

  const [ searchTerm, setSearchTerm ] = useState('');
  const [ status, setStatus ] = useState(productStatus.ALL);
  const [ pageNumber, setPageNumber ] = useState(1);
  const [ pageSize, setPageSize ] = useState(10);

  const [ total, setTotal ] = useState(0);
  const [ products, setProducts ] = useState([]);

  const [loading, setLoading] = useState(false);

  const fetchProducts = async (page = pageNumber) => {
    try {
      setLoading(true);
      const { data, error } = await getProducts(searchTerm, status, page, pageSize);

      if (error) throw error;

      setTotal(data?.total ?? 0);
      const items = Array.isArray(data?.productItems) ? data.productItems : (Array.isArray(data) ? data : []);
      setProducts(items);
      setPageNumber(page);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
   
  }, [status, pageSize, pageNumber]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSearch = async () => {
    
    await fetchProducts(1);
  };

  return (
    <div>
      <Card>
        <div
          className='flex justify-between items-center mb-3'
        >
          <h1 className='text-3xl'>Productos</h1>
          <Button
            className='h-11 w-11 rounded-2xl sm:hidden'
          >
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5 11C4.44772 11 4 10.5523 4 10C4 9.44772 4.44772 9 5 9H15C15.5523 9 16 9.44772 16 10C16 10.5523 15.5523 11 15 11H5Z" fill="#000000"></path> <path d="M9 5C9 4.44772 9.44772 4 10 4C10.5523 4 11 4.44772 11 5V15C11 15.5523 10.5523 16 10 16C9.44772 16 9 15.5523 9 15V5Z" fill="#000000"></path> </g></svg>
          </Button>

          <Button
            className='hidden sm:block'
            onClick={() => navigate('/admin/products/create')}
          >
            Crear Producto
          </Button>
        </div>

        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex items-center gap-3 w-full'>
            <input
              value={searchTerm}
              onChange={(evt) => setSearchTerm(evt.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
              type="text"
              placeholder='Buscar Productos...'
              className='text-[1.3rem] w-full rounded border px-3 py-2'
            />

            <Button className='h-11 w-11' onClick={handleSearch}>
              🔍
            </Button>
          </div>

          <select
            value={status}
            onChange={evt => { setStatus(evt.target.value); setPageNumber(1); }}
            className='text-[1.3rem]'
          >
            <option value={productStatus.ALL}>Todos</option>
            <option value={productStatus.ENABLED}>Habilitados</option>
            <option value={productStatus.DISABLED}>Inhabilitados</option>
          </select>
        </div>
      </Card>

     <div className='mt-4 flex flex-col gap-4'>
        {
          loading
            ? <span>Buscando datos...</span>
            : products.length === 0
              ? <span>No hay productos</span>
              : products.map(product => (
                <Card key={product.sku} className='p-4 border border-gray-200 rounded-lg'>
                  <div className='flex justify-between items-center'>
                    <div>
                      <h2 className='text-lg font-semibold'>{product.name}</h2>
                      <p className='text-sm text-gray-600'>SKU: {product.sku}</p>
                    </div>
                    <div className='text-right space-y-1'>
                      <p className='text-green-600 font-bold text-xl'>${resolvePrice(product)}</p>
                      <p className='text-blue-600 font-bold'>Stock: {resolveStock(product)}</p>
                      <p className='text-sm'>{product.isActive ? '✓ Activo' : '✗ Inactivo'}</p>
                    </div>
                  </div>
                </Card>
              ))
        }
      </div>

      <div className='flex justify-center items-center mt-3'>
        <button
          disabled={pageNumber === 1}
          onClick={() => setPageNumber(pageNumber - 1)}
          className='bg-gray-200 disabled:bg-gray-100 px-3 py-1 rounded'
        >
          Atras
        </button>
        <span className='mx-3'>{pageNumber} / {totalPages}</span>
        <button
          disabled={ pageNumber === totalPages }
          onClick={() => setPageNumber(pageNumber + 1)}
          className='bg-gray-200 disabled:bg-gray-100 px-3 py-1 rounded'
        >
          Siguiente
        </button>

        <select
          value={pageSize}
          onChange={evt => {
            setPageNumber(1);
            setPageSize(Number(evt.target.value));
          }}
          className='ml-3'
        >
          <option value="2">2</option>
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="20">20</option>
        </select>
      </div>
    </div>

  );
};

export default ListProductsPage;