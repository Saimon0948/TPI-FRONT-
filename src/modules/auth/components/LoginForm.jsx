import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { data, useNavigate } from 'react-router-dom';
import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import useAuth from '../hook/useAuth';
import { frontendErrorMessage } from '../helpers/backendError';
import RegisterForm from './RegisterForm';
import Modal from '../../shared/components/Modal';

function LoginForm({onClose}) {

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

 
  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const closeAll = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };
  const [errorMessage, setErrorMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { username: '', password: '' } });

  const navigate = useNavigate();

  const { singin } = useAuth();

  const parseJwt = (token) => {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  const onValid = async (formData) => {
    try {
      const { data, error } = await singin(formData.username, formData.password);

      if (error) {
        setErrorMessage(error.frontendErrorMessage || error.message || 'Error al iniciar sesión');
        return;
      }

      
      let role = null;
//verficiar el role del usuario para redirigirlo y token
      if (data) {
        if (typeof data === 'string') {
          const payload = parseJwt(data);
          role = payload?.role ?? payload?.roles?.[0] ?? null;
        } else {
          role = data.user?.role ?? data.role ?? data.roles?.[0] ?? null;
          
          const token = data.token ?? data.accessToken ?? null;
          if (!role && token) {
            const payload = parseJwt(token);
            role = payload?.role ?? payload?.roles?.[0] ?? null;
          }
        }
      }

     
      if (onClose) onClose();

      if (role === 'admin') navigate('/admin/home');
      else navigate('/');

    } catch (error) {
      if (error?.response?.data?.code) {
        setErrorMessage(frontendErrorMessage[error?.response?.data?.code]);
      } else {
        setErrorMessage('Llame a soporte');
      }
    }
  };

  return (
    <div className='relative'>
      
        {!onClose && (
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-2xl font-bold'
          >
            ✕
          </button>
        )}
    <form className='
        flex
        flex-col
        gap-20
        bg-white
        p-8
        sm:w-md
        sm:gap-4
        sm:rounded-lg
        sm:shadow-lg
      '
    onSubmit={handleSubmit(onValid)}
    >
      <Input
        label='Usuario'
        { ...register('username', {
          required: 'Usuario es obligatorio',
        }) }
        error={errors.username?.message}
      />
      <Input
        label='Contraseña'
        { ...register('password', {
          required: 'Contraseña es obligatorio',
        }) }
        type='password'
        error={errors.password?.message}
      />

      <Button type='submit'>
                Iniciar Sesión
      </Button>
      <Button variant='secondary' onClick={openRegister}>Registrar Usuario</Button>
      {errorMessage && <p className='text-red-500'>{errorMessage}</p>}
    </form>

    <Modal isOpen={isRegisterOpen} onClose={closeAll}>
      <RegisterForm isModal={true} onClose={closeAll} />
    </Modal>
    </div>
  );
};

export default LoginForm;
