import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../../shared/components/Button";
import { Outlet } from "react-router-dom";
import { useCart } from "../../shared/hook/useCart";
import LoginForm from "../../auth/components/LoginForm";
import RegisterForm from "../../auth/components/RegisterForm";
import Modal from "../../shared/components/Modal";


function CustomerLayout({ auth, search, onSearch }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartItemsCount } = useCart();
  const navigate = useNavigate();
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
  return (
    <div>
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
                <span className="text-xl">&#128722;</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={onSearch}
                className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-transparent"
              />
              <Button
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
              </Button>
            </form>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {auth?.isAuthenticated ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  auth.singout();
                  navigate("/");
                }}
                className="px-4 py-2 text-sm"
              >
                Cerrar sesión
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="default"
                  onClick={openLogin}
                  className="px-4 py-2 text-sm"
                >
                  Iniciar Sesión
                </Button>
              </>
            )}
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
                onClick={() => setMobileMenuOpen(false)}
                className="relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span className="text-xl">&#128722;</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
                {auth?.isAuthenticated ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      auth.singout();
                      setMobileMenuOpen(false);
                      navigate("/");
                    }}
                    className="w-full px-4 py-2 text-sm"
                  >
                    Cerrar sesión
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      onLoginClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm"
                  >
                    Iniciar Sesión
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
        
        </div>
    </header>
    <main className="flex-1 p-6 bg-gray-50">

        <Outlet/>
    </main>

    {/* Modales de Autenticación */}
        <Modal isOpen={isLoginOpen} onClose={closeAll}>
          <LoginForm onClose={closeAll} />
        </Modal>

        <Modal isOpen={isRegisterOpen} onClose={closeAll}>
          <RegisterForm isModal={true} onClose={closeAll} />
        </Modal>
    </div>
  );
}

export default CustomerLayout;