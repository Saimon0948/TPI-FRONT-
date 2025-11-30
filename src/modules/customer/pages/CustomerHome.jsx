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

  const totalItemsInCart = cart.reduce(
    (acc, item) => acc + (item.quantity || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center w-10 h-10">
                <svg
                  viewBox="0 0 40 40"
                  className="w-full h-full text-black"
                  fill="currentColor"
                >
                  <path d="M20 8 C20 8, 12 8, 12 16 C12 16, 12 24, 20 24 C20 24, 28 24, 28 16 C28 16, 28 8, 20 8 Z M20 12 C20 12, 16 12, 16 16 C16 16, 16 20, 20 20 C20 20, 24 20, 24 16 C24 16, 24 12, 20 12 Z" />
                  <circle cx="20" cy="16" r="2" />
                </svg>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-purple-100 text-gray-900"
                >
                  Productos
                </Link>
                <Link
  to="/cart"
  className="relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
>
  {/* Icono */}
  <span className="text-xl">&#128722;</span>

  {/* Badge rojo */}
  {totalItemsInCart > 0 && (
    <span
      className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
    >
      {totalItemsInCart}
    </span>
  )}
</Link>
              </nav>
            </div>

            {/* Search Bar - Siempre visible */}
            <div className="flex-1 max-w-md mx-4">
              <form onSubmit={(e) => e.preventDefault()} className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </form>
            </div>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {(() => {
                const { isAuthenticated, singout } = auth;
                if (isAuthenticated) {
                  return (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        singout();
                        navigate('/');
                      }}
                      className="px-4 py-2 text-sm"
                    >
                      Cerrar sesión
                    </Button>
                  );
                }

                return (
                  <>
                    <Button
                      type="button"
                      variant="default"
                      onClick={openLogin}
                      className="px-4 py-2 text-sm"
                    >
                      Iniciar Sesión
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate('/signup')}
                      className="px-4 py-2 text-sm"
                    >
                      Registrarse
                    </Button>
                  </>
                );
              })()}
            </div>
           
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
              <nav className="flex flex-col gap-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-purple-100 text-gray-900"
                >
                  Productos
                </Link>
                <Link
  to="/cart"
  className="relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
>
  {/* Icono */}
  <span className="text-xl">&#128722;</span>

  {/* Badge rojo */}
  {totalItemsInCart > 0 && (
    <span
      className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
    >
      {totalItemsInCart}
    </span>
  )}
</Link>
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                  {auth.isAuthenticated ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        auth.singout();
                        setMobileMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full px-4 py-2 text-sm"
                    >
                      Cerrar sesión
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          openLogin();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-sm"
                      >
                        Iniciar Sesión
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          navigate('/signup');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-sm"
                      >
                        Registrarse
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

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
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product, 1)}
                              disabled={quantity >= availableStock}
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
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
                    >
                      Anterior
                    </Button>

                    <span className="px-4">
                      Página {currentPage} de {totalPages}
                    </span>

                    <Button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
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
