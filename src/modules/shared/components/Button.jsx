function Button({ children, type = 'button', variant = 'default', ...restProps }) {
  if (!['button', 'reset', 'submit'].includes(type)) {
    console.warn('type prop not supported');
  }

  const variantStyle = {
    default: 'bg-purple-200 hover:bg-purple-300 transition sm:px-4 sm:py-2 sm:w-fit sm:text-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 transition sm:px-4 sm:py-2 sm:w-fit sm:text-sm',
  };

  return (
    <button
      {...restProps}
      className={`${variantStyle[variant]} ${restProps.className}`}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;
