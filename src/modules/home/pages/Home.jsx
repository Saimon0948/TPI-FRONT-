import { useEffect, useState } from 'react';
import Card from '../../shared/components/Card';

function Home() {
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Función robusta para extraer cantidad según el formato que devuelva el backend
  const extractCount = (data) => {
    if (Array.isArray(data)) return data.length;
    if (Array.isArray(data.items)) return data.items.length;
    if (typeof data.totalCount === "number") return data.totalCount;

    // fallback: encontrar cualquier array dentro del objeto
    const arrayInside = Object.values(data).find(v => Array.isArray(v));
    return arrayInside?.length ?? 0;
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        // ---------- Productos ----------
        const productsRes = await fetch('/api/products', {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (productsRes.ok) {
          const data = await productsRes.json();
          console.log("Products response:", data);
          setProductCount(extractCount(data));
        } else {
          console.warn("Error obteniendo productos:", productsRes.status);
        }

        // ---------- Órdenes ----------
        const ordersRes = await fetch('/api/orders?pageSize=9999', {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          console.log("Orders response:", data);
          setOrderCount(extractCount(data));
        } else {
          console.warn("Error obteniendo órdenes:", ordersRes.status);
        }

      } catch (err) {
        console.error("Error haciendo fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className='flex flex-col gap-3 sm:grid sm:grid-cols-2'>
      <Card>
        <h3>Productos</h3>
        <p>Cantidad: {loading ? '...' : productCount}</p>
      </Card>

      <Card>
        <h3>Órdenes</h3>
        <p>Cantidad: {loading ? '...' : orderCount}</p>
      </Card>
    </div>
  );
}

export default Home;
