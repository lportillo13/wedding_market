import Link from 'next/link';

export default async function CheckEmail({ searchParams }: {
  searchParams: Promise<{ lang?: string; vendor?: string }>;
}) {
  const params = await searchParams;
  const es = params.lang === 'es';
  return (
    <main className="container py-5" style={{ maxWidth: 640 }}>
      <h1>{es ? 'Revisa tu correo' : 'Check your email'}</h1>
      <p>{es
        ? 'Abre el enlace de confirmación en tu correo para verificar tu cuenta. Revisa también la carpeta de correo no deseado.'
        : 'Open the confirmation link in your email to verify your account. Check your spam folder too.'}</p>
      {params.vendor === '1' && <p>{es
        ? 'Después de confirmar, vuelve al registro de proveedores para completar tu perfil y subir tus imágenes.'
        : 'After confirming, return to vendor registration to complete your profile and upload your images.'}</p>}
      <Link href="/login" className="btn btn-primary">{es ? 'Iniciar sesión' : 'Sign in'}</Link>
    </main>
  );
}
