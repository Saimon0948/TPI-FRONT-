import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom"; 
import { getCustomerProducts } from "../services/products"; // Asegúrate que la ruta sea correcta
import Card from "../../shared/components/Card";
import Button from "../../shared/components/Button";

const CART_KEY = "cart";
const PAGE_SIZE = 8;

// --- Helper Functions ---
function getProductId(product) { return product?.Id ?? product?.id ?? null; }
function getProductName(product) { return product?.Name ?? product?.name ?? ""; }
function getProductPrice(product) { return product?.CurrentUnitPrice ?? product?.price ?? 0; }
function getProductStock(product) { return product?.StockQuantity ?? product?.stockQuantity ?? product?.stock ?? 0; }

function getCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const ProductList = () => {
  // Recibimos el término de búsqueda desde el Layout
  const { searchTerm } = useOutletContext() || { searchTerm: "" };

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(getCartFromStorage); // Necesitamos leer el carrito para validar stock
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState({}); 

  // Sincronizar carrito para validar stock en tiempo real
  useEffect(() => {
    const handleStorageChange = () => setCart(getCartFromStorage());
    window.addEventListener('cartUpdated', handleStorageChange); // Escuchamos nuestro evento personalizado
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('cartUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Cargar Productos
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await getCustomerProducts();
      if (error) {
        setError("No se pudieron cargar los productos.");
      } else {
        setProducts(Array.isArray(data) ? data : data.items ?? []);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // Filtrado y Paginación
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => getProductName(p).toLowerCase().includes(term));
  }, [products, searchTerm]);

  // Resetear página si cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  // Lógica de Stock y Cantidades
  const getAvailableStock = (product) => {
    const stock = getProductStock(product);
    const productId = getProductId(product);
    const existingCartItem = cart.find((item) => item.productId === productId);
    const quantityInCart = existingCartItem?.quantity || 0;
    return Math.max(0, stock - quantityInCart);
  };

  const handleQuantityChange = (product, delta) => {
    const productId = getProductId(product);
    const availableStock = getAvailableStock(product);
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      return { ...prev, [productId]: Math.max(0, Math.min(availableStock, current + delta)) };
    });
  };

  const handleQuantityInput = (product, value) => {
    const productId = getProductId(product);
    const availableStock = getAvailableStock(product);
    const numValue = parseInt(value, 10) || 0;
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, Math.min(availableStock, numValue)) }));
  };

  const handleAddToCart = (product) => {
    const productId = getProductId(product);
    const quantity = quantities[productId] || 0;

    if (quantity <= 0) {
        alert("Selecciona una cantidad mayor a 0");
        return;
    }

    const currentCart = getCartFromStorage();
    const existingItemIndex = currentCart.findIndex(item => item.productId === productId);

    let newCart;
    if (existingItemIndex >= 0) {
        newCart = [...currentCart];
        newCart[existingItemIndex].quantity += quantity;
    } else {
        newCart = [...currentCart, {
            productId,
            name: getProductName(product),
            unitPrice: getProductPrice(product),
            quantity
        }];
    }

    localStorage.setItem(CART_KEY, JSON.stringify(newCart));
    
    // Disparar evento para avisar al Layout que actualice el badge
    window.dispatchEvent(new Event("cartUpdated"));
    
    // Actualizar estado local del carrito para recálculo de stock
    setCart(newCart);
    setQuantities((prev) => ({ ...prev, [productId]: 0 }));
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-8">
            <p>Cargando productos...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Product list */}
        {!loading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p>No se encontraron productos.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {pagedProducts.map((product) => {
                    const productId = getProductId(product);
                    const quantity = quantities[productId] || 0;
                    const availableStock = getAvailableStock(product);
                    return (
                      <Card
                        key={productId}
                        className="flex flex-col p-0 overflow-hidden"
                      >
                        {/* Image Placeholder */}
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <svg
                            className="w-20 h-20 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {/* Mountain and sun icon */}
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M3 20L12 8L21 20H3Z"
                            />
                            <circle cx="18" cy="6" r="3" fill="currentColor" opacity="0.3" />
                          </svg>
                        </div>
                        
                        <div className="p-4 flex flex-col flex-1">

                          {/* Product Name */}
                          <h2 className="text-base font-medium mb-2">
                            {getProductName(product) || "Text"}
                          </h2>

                          {/* Price */}
                          <p className="text-lg font-semibold mb-4">
                            $
                            {Number(getProductPrice(product)).toLocaleString("es-AR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </p>

                          {/* Quantity Selector and Add Button */}
                          <div className="mt-auto flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product, -1)}
                              disabled={quantity <= 0}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={availableStock}
                              value={quantity}
                              onChange={(e) =>
                                handleQuantityInput(product, e.target.value)
                              }
                              className="w-12 h-8 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-200"
                            />
                            <Button
                              type="button"
                              onClick={() => handleQuantityChange(product, 1)}
                              disabled={quantity >= availableStock}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              disabled={availableStock === 0 || quantity <= 0}
                              className="flex-1 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {availableStock === 0 ? "Sin stock" : "Agregar"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      variant="default"
                    >
                      Anterior
                    </Button>

                    <span className="px-4 text-sm sm:w-fit sm:px-4 sm:py-2" >
                      Página {currentPage} de {totalPages}
                    </span>

                    <Button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      variant="default"
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  };

export default ProductList;