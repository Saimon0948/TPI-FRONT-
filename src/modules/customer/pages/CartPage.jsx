import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button';
import Input from '../../shared/components/Input';
import Modal from '../../shared/components/Modal';
import LoginForm from '../../auth/components/LoginForm';
import  useAuth  from '../../auth/hook/useAuth';
import { createOrder } from '../../orders/services/order.js';
import { useForm } from 'react-hook-form';

const CART_KEY = 'cart';


const getCustomerId = () => {
    const storedId = localStorage.getItem('customerId');
    return storedId || null;
};

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Formulario para direcciones (Requerido por el Backend)
  const { register, handleSubmit, getValues, formState: { errors } } = useForm();

  // 1. Cargar carrito al iniciar
  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing cart", e);
      }
    }
  }, []);

  // 2. Calcular total
  const totalAmount = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

  // 3. Lógica de envío de orden
  const handleProcessOrder = async () => {
    setSubmitError('');
    const customerId = getCustomerId(); 

    // Mapear carrito al formato que pide C# OrderItemModel
    const orderItems = cart.map(item => ({
      ProductId: item.productId,
      Quantity: item.quantity
    }));

    const payload = {
      ShippingAddress: getValues('shippingAddress'),
      BillingAddress: getValues('billingAddress'),
      CustomerId: customerId, 
      OrderItems: orderItems
    };

    const { data, error } = await createOrder(payload);

    if (error) {
      setSubmitError('Error al procesar la orden. Intente nuevamente.');
      return;
    }

    // Éxito: Limpiar y redirigir
    localStorage.removeItem(CART_KEY);
    setCart([]);
    setPendingCheckout(false); 
    // Disparar evento para actualizar el badge
    window.dispatchEvent(new Event('cartUpdated'));
    alert('¡Compra finalizada con éxito!');
    navigate('/'); // Redirigir al listado (Home)
  };

  // 4. Click en "Finalizar Compra"
  const onCheckoutClick = (formData) => {
    if (cart.length === 0) return;

    if (isAuthenticated) {
      // Usuario logueado: enviar directo
      handleProcessOrder();
    } else {
      // Usuario NO logueado: abrir modal y marcar pendiente
      setPendingCheckout(true);
      setIsLoginOpen(true);
    }
  };

  // 5. EFECTO MÁGICO: Detectar cuando el usuario se loguea y tenía una compra pendiente
  useEffect(() => {
    if (isAuthenticated && pendingCheckout) {
      // El modal se cerrará por lógica del Auth, y aquí detectamos que ya entró
      // Cerramos modal visualmente por si acaso y enviamos
      setIsLoginOpen(false); 
      handleProcessOrder();
    }
  }, [isAuthenticated, pendingCheckout]);

const updateQuantity = (id, delta) => {
    const newCart = cart.map(item => {
        if (item.productId === id) {
            
            const newQ = Math.max(1, item.quantity + delta); 
            return { ...item, quantity: newQ };
        }
        return item;
    });
    setCart(newCart);
    localStorage.setItem(CART_KEY, JSON.stringify(newCart));
    // Disparar evento para actualizar el badge
    window.dispatchEvent(new Event('cartUpdated'));
  };
  const removeItem = (id) => {
    const newCart = cart.filter(item => item.productId !== id);
    setCart(newCart);
    localStorage.setItem(CART_KEY, JSON.stringify(newCart));
    // Disparar evento para actualizar el badge
    window.dispatchEvent(new Event('cartUpdated'));
  };

  if (cart.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
        <Button onClick={() => navigate('/')}>Volver a comprar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Tu Carrito</h1>
          <Button onClick={() => navigate('/')} className="ml-4">Volver</Button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* --- COLUMNA IZQUIERDA: PRODUCTOS --- */}
          <div className="flex-1">
            
            {/* 1. VISTA DESKTOP */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cart.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                            {/* Placeholder de imagen */}
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                         <div className="flex justify-center items-center space-x-2">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300">-</button>
                            <span className="text-sm text-gray-900 w-4">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300">+</button>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        ${item.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        ${(item.unitPrice * item.quantity).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => removeItem(item.productId)}
                          className="text-red-600 hover:text-red-900 font-medium text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. VISTA MOBILE (Tarjetas) - Visible solo en pantallas pequeñas */}
            <div className="md:hidden space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="bg-white p-4 rounded-lg shadow flex items-start space-x-4">
                   <div className="flex-shrink-0 h-20 w-20 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Precio: ${item.unitPrice.toLocaleString()}</p>
                      
                      <div className="flex items-center mt-3">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 bg-gray-100 border rounded font-bold text-gray-600">-</button>
                        <span className="px-3 text-gray-800 text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 bg-gray-100 border rounded font-bold text-gray-600">+</button>
                      </div>
                   </div>
                   <div className="flex flex-col justify-between items-end h-full">
                      <span className="font-bold text-gray-900">${(item.unitPrice * item.quantity).toLocaleString()}</span>
                      <button 
                          onClick={() => removeItem(item.productId)}
                          className="text-xs text-red-500 mt-4 font-medium uppercase"
                        >
                          Quitar
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- COLUMNA DERECHA: RESUMEN Y PAGO --- */}
          <div className="lg:w-96">
             <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen del Pedido</h2>
                
                <div className="flex justify-between mb-2 text-gray-600">
                   <span>Subtotal</span>
                   <span>${totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2 text-gray-600">
                   <span>Envío</span>
                   <span className="text-green-600">Gratis</span>
                </div>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="flex justify-between mb-6 text-xl font-bold text-gray-900">
                   <span>Total</span>
                   <span>${totalAmount.toLocaleString()}</span>
                </div>

                {/* Formulario de Direcciones */}
                <form onSubmit={handleSubmit(onCheckoutClick)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Envío</label>
                        <input 
                            type="text"
                            {...register('shippingAddress', { required: 'Requerido' })}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500 ${errors.shippingAddress ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Calle 123, Ciudad"
                        />
                        {errors.shippingAddress && <p className="text-xs text-red-500 mt-1">{errors.shippingAddress.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Facturación</label>
                        <input 
                            type="text"
                            {...register('billingAddress', { required: 'Requerido' })}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500 ${errors.billingAddress ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Igual a envío"
                        />
                        {errors.billingAddress && <p className="text-xs text-red-500 mt-1">{errors.billingAddress.message}</p>}
                    </div>
                    
                    {submitError && <div className="p-2 bg-red-100 text-red-600 text-sm rounded">{submitError}</div>}

                    <Button type="submit" className="w-full py-3 text-lg shadow-md">
                        Finalizar Compra
                    </Button>
                </form>
             </div>
          </div>

        </div>

        {/* Modal de Login (Flujo Checkout Automático) */}
        <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}>
          <div className="p-2">
            <h3 className="text-center text-lg font-bold text-gray-800 mb-2">Inicia sesión para continuar</h3>
            <p className="text-center text-gray-500 mb-6 text-sm">Tus datos se guardarán para el envío.</p>
            
            {/* Al cerrar el login exitosamente, el useEffect arriba detectará el cambio y procesará la orden */}
            <LoginForm onClose={() => setIsLoginOpen(false)} />
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default CartPage;