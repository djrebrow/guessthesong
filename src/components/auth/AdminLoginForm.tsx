import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../state/useAuthStore';

const AdminLoginForm = () => {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(password);
    setPassword('');
  };

  const busy = status === 'checking';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md"
        aria-labelledby="admin-login-heading"
      >
        <h2 id="admin-login-heading" className="mb-4 text-xl font-semibold text-slate-800">
          {t('admin.loginTitle')}
        </h2>
        <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700">
          {t('admin.passwordLabel')}
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(event) => {
            if (error) {
              clearError();
            }
            setPassword(event.target.value);
          }}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
          aria-describedby={error ? 'admin-login-error' : undefined}
          disabled={busy}
        />
        {error && (
          <p id="admin-login-error" role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="mt-4 w-full rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          disabled={busy}
        >
          {busy ? t('admin.loginBusy') : t('admin.loginButton')}
        </button>
        <p className="mt-4 text-xs text-slate-500">{t('admin.loginHint')}</p>
      </form>
    </div>
  );
};

export default AdminLoginForm;
