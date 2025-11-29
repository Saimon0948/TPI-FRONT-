import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Input from '../../shared/components/Input';
import Button from '../../shared/components/Button';
import { frontendErrorMessage } from '../helpers/backendError';
import { registerUser } from '../services/register';

function RegisterForm({ onClose, onSwitchToLogin }) {

     const [errorMessage, setErrorMessage] = useState('');
    const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
    } = useForm({ defaultValues: { username: '', email: '', role: '', password: '', confirmPassword: '' } });

  const navigate = useNavigate();

  const onValid = async (formData) => {
    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        role: formData.role,
        
      };

      const { data, error } = await registerUser(payload);


      if (onClose) {   //Para el Modal
         
         if(onSwitchToLogin) {
             onSwitchToLogin(); 
         } else {
             onClose();
         }
      } else {
         navigate('/login');
      }
      if (error) {
        
        if (error?.response?.data?.code) {
          setErrorMessage(frontendErrorMessage[error.response.data.code] || 'Error al registrar');
        } else {
          setErrorMessage(error.message || 'Error al registrar');
        }

        return;
      }

      
      navigate('/login');
    } catch (err) {
      console.error(err);
      setErrorMessage('Llame a soporte');
    }
  };


  return (
    <div className='relative'>

        {onClose && (
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
        onSubmit={handleSubmit(onValid)}>

        <Input
          label='Usuario'
          {...register('username', { required: 'Usuario es obligatorio' })}
          error={errors.username?.message}
        />

        <Input
          label='Email'
          {...register('email', {
            required: 'Email es obligatorio',
            validate: (value) => {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              return emailRegex.test(value) || 'Email no es válido';
            },
          })}
          error={errors.email?.message}
        />

        <div className='flex flex-col h-20'>
          <label>Rol</label>
          <select
            className={errors.role ? 'border-red-400' : ''}
            {...register('role', { required: 'Seleccione un rol' })}
          >
            <option value=''>Seleccione...</option>
            <option value='user'>customer</option>
            <option value='admin'>admin</option>
          </select>
          {errors.role && <p className='text-red-500 text-base sm:text-xs'>{errors.role.message}</p>}
        </div>
           

        
        <Input
          label='Contraseña'
          type='password'
          {...register('password', {
            required: 'Contraseña es obligatoria',
            validate: (value) => {
              if (!/[A-Z]/.test(value)) return 'Debe contener al menos una letra mayúscula';
              if (!/[a-z]/.test(value)) return 'Debe contener al menos una letra minúscula';
              const digitCount = (value.match(/\d/g) || []).length;
              if (digitCount < 3) return 'Debe contener al menos 3 números';
              if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value)) return 'Debe contener al menos 1 símbolo';
              return true;
            },
          })}
          error={errors.password?.message}
        />
        
          <Input
            label='Confirmar contraseña'
            type='password'
            {...register('confirmPassword', {
              required: 'Confirme la contraseña',
              validate: (value) => {
                const pwd = watch('password');
                return value === pwd || 'Contraseña no coincide';
              },
            })}
            error={errors.confirmPassword?.message}
          />
                   

        <Button type='submit'>Registrar</Button>

        {errorMessage && <p className='text-red-500'>{errorMessage}</p>}

        </form>



    </div>

  );}export default RegisterForm;