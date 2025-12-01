import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from '../../auth/hook/useAuth';
import { getCustomerProducts } from "../services/products";
import Card from "../../shared/components/Card";
import Button from "../../shared/components/Button";
import Modal from "../../shared/components/Modal";
import RegisterForm from "../../auth/components/RegisterForm";
import LoginForm from "../../auth/components/LoginForm";

const CART_KEY = "cart";
const PAGE_SIZE = 8; // 4 columnas x2 filas


// Helper functions para acceder a los campos del producto
function getProductId(product) {
  return product?.Id ?? product?.id ?? null;
}

function getProductName(product) {
  return product?.Name ?? product?.name ?? "";
}

function getProductPrice(product) {
  return product?.CurrentUnitPrice ?? product?.price ?? 0;
}

function getProductStock(product) {
  return product?.StockQuantity ?? product?.stockQuantity ?? product?.stock ?? 0;
}

function getInitialCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          ...item,
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
        }))
      : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

const CustomerHome = () => {
  
//Modales de Login y Register
const [isLoginOpen, setIsLoginOpen] = useState(false);
const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const closeAll = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(getInitialCart);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState({}); // Estado para cantidades por producto
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Estado para menú móvil

  const navigate = useNavigate();
  const auth = useAuth();

  // 1) Cargar productos UNA sola vez desde /api/products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await getCustomerProducts();

      if (error) {
        setError("No se pudieron cargar los productos.");
        setLoading(false);
        return;
      }

      // /api/products devuelve un array plano
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts(data.items ?? []);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

  // 1.5) Sincronizar carrito cuando vuelve a la página (después de checkout)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCart(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error("Error parsing cart", e);
          setCart([]);
        }
      } else {
        setCart([]);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleStorageChange();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 2) Guardar el total de items del carrito en sessionStorage y disparar evento
  useEffect(() => {
    const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);
    sessionStorage.setItem('cartItemsCount', totalItems.toString());
    
    // Disparar evento personalizado para que CartContext se entere del cambio
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cart]);

  // 2) Búsqueda por nombre (en frontend)
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;

    return products.filter((p) =>
      getProductName(p).toLowerCase().includes(term)
    );
  }, [products, search]);

  // 3) Paginación en frontend
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  // Resetear a página 1 cuando cambia la búsqueda
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // 4) Obtener stock disponible considerando lo que ya está en el carrito
  const getAvailableStock = (product) => {
    const stock = getProductStock(product);
    const productId = getProductId(product);
    const existingCartItem = cart.find((item) => item.productId === productId);
    const quantityInCart = existingCartItem?.quantity || 0;
    return Math.max(0, stock - quantityInCart);
  };

  // 5) Manejar cantidad por producto con validación de stock
  const handleQuantityChange = (product, delta) => {
    const productId = getProductId(product);
    const availableStock = getAvailableStock(product);
    
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const newQuantity = Math.max(0, Math.min(availableStock, current + delta));
      return { ...prev, [productId]: newQuantity };
    });
  };

  const handleQuantityInput = (product, value) => {
    const productId = getProductId(product);
    const availableStock = getAvailableStock(product);
    const numValue = parseInt(value, 10) || 0;
    const clampedValue = Math.max(0, Math.min(availableStock, numValue));
    
    setQuantities((prev) => ({
      ...prev,
      [productId]: clampedValue,
    }));
  };

  // 6) Agregar al carrito con la cantidad seleccionada y validación de stock
  const handleAddToCart = (product) => {
    const productId = getProductId(product);
    const quantity = quantities[productId] || 0;

    if (quantity <= 0) {
      setError("Seleccioná una cantidad mayor a 0.");
      setTimeout(() => setError(""), 2000);
      return;
    }

    // Validar stock disponible
    const availableStock = getAvailableStock(product);
    if (quantity > availableStock) {
      setError(`No hay suficiente stock disponible. Stock disponible: ${availableStock}`);
      setTimeout(() => setError(""), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);

      let nextCart;
      if (existing) {
        const newTotalQuantity = existing.quantity + quantity;
        // Validar nuevamente antes de actualizar
        if (newTotalQuantity > getProductStock(product)) {
          setError(`No se puede agregar. La cantidad total excedería el stock disponible (${getProductStock(product)} unidades)`);
          setTimeout(() => setError(""), 3000);
          return prev; // No actualizar el carrito
        }
        nextCart = prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: newTotalQuantity }
            : item
        );
      } else {
        nextCart = [
          ...prev,
          {
            productId: productId,
            name: getProductName(product),
            unitPrice: getProductPrice(product),
            quantity,
          },
        ];
      }

      saveCart(nextCart);
      return nextCart;
    });

    // Resetear cantidad después de agregar
    setQuantities((prev) => ({ ...prev, [productId]: 0 }));
  };

  

  return (
    <div className="min-h-screen bg-gray-100">
      
      
      {/* Main Content */}
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

        {/* Modales de Autenticación */}
        <Modal isOpen={isLoginOpen} onClose={closeAll}>
          <LoginForm onClose={closeAll} />
        </Modal>

        <Modal isOpen={isRegisterOpen} onClose={closeAll}>
          <RegisterForm isModal={true} onClose={closeAll} />
        </Modal>
      </div>
    </div>
  );
};

export default CustomerHome;
