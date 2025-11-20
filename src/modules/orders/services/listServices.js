export const listOrders = async ({ search = '', status = '', pageNumber = 1, pageSize = 10 } = {}) => {
  const qs = new URLSearchParams({
    search,
    status,
    pageNumber,
    pageSize,
  });

  const response = await fetch(`/api/orders?${qs.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return { data, error: null };
  } else {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    return { data: null, error };
  }
};