import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tratamiento de datos | RIO',
  description: 'Política de tratamiento de datos personales del portal RIO.',
};

export default function TratamientoDeDatosPage() {
  return (
    <main className="min-h-screen bg-rio-background px-4 py-10 text-rio-ink sm:py-16">
      <article className="mx-auto max-w-3xl rounded-3xl border border-rio-border bg-white p-6 shadow-sm sm:p-10">
        <Link href="/login" className="text-sm font-semibold text-rio-gold-dark hover:underline">← Volver al ingreso</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-rio-gold-dark">RIO · Privacidad</p>
        <h1 className="mt-2 text-3xl font-bold">Política de tratamiento de datos personales</h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Borrador pendiente de revisión y aprobación. No se publica la dirección de la bodega. RIO debe definir con asesoría jurídica una dirección de contacto adecuada y validar esta política y su procedimiento de autorización antes de publicarla como definitiva.
        </p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-rio-ink">
          <section><h2 className="text-lg font-bold">1. Responsable</h2><p>RIO ACCESORIOS Y BISUTERIA S.A.S., NIT 901.979.300-5, domiciliada en Medellín, es responsable del tratamiento de los datos personales descritos aquí. Correo para consultas y reclamos: <a href="mailto:riomayoristas@gmail.com" className="font-semibold text-rio-gold-dark underline">riomayoristas@gmail.com</a>. Teléfono: <a href="tel:+573124560359" className="font-semibold text-rio-gold-dark underline">312 456 0359</a>. Dirección física de contacto: pendiente de definir; no se publica la ubicación de la bodega.</p></section>
          <section><h2 className="text-lg font-bold">2. Datos tratados</h2><p>RIO puede tratar datos de contacto e identificación de las personas que representan a sus clientes mayoristas o utilizan el portal: nombre, usuario, correo electrónico, teléfono, dirección de entrega, datos necesarios para facturar, historial de pedidos y comunicaciones relacionadas. El NIT y otros datos de una empresa se usan para su identificación y facturación; cuando un dato permita identificar a una persona natural, se trata conforme a esta política.</p></section>
          <section><h2 className="text-lg font-bold">3. Finalidades</h2><p>Los datos se usan para crear y administrar el vínculo comercial y el acceso al portal; verificar identidad; recibir, preparar, facturar y despachar pedidos; comunicar novedades operativas; contactar al cliente o destinatario cuando el envío lo requiera; atender consultas, cambios, cancelaciones y garantías; cumplir obligaciones legales y conservar la trazabilidad de las operaciones. RIO no declara una finalidad de publicidad por WhatsApp o correo electrónico.</p></section>
          <section><h2 className="text-lg font-bold">4. Personas y proveedores que intervienen</h2><p>El personal autorizado de RIO accede a la información según sus funciones. Para prestar el servicio pueden intervenir proveedores tecnológicos de alojamiento, autenticación y base de datos, y la transportadora seleccionada para el despacho. A esta última se le comunican únicamente los datos necesarios para entregar el pedido y contactar al destinatario. Los términos de estos proveedores y la ubicación del tratamiento deben verificarse antes de la aprobación final de esta política.</p></section>
          <section><h2 className="text-lg font-bold">5. Datos guardados en el dispositivo</h2><p>Algunas funciones para vendedores pueden conservar temporalmente en el navegador o en la aplicación instalada catálogos, clientes, borradores y pedidos pendientes para trabajar durante interrupciones de conexión. En dispositivos compartidos, cada persona debe usar su propia cuenta y cerrar sesión al terminar. RIO debe definir y aplicar reglas internas para el uso y limpieza segura de esos dispositivos.</p></section>
          <section><h2 className="text-lg font-bold">6. Derechos del titular</h2><p>El titular puede conocer, actualizar y rectificar sus datos, solicitar prueba de la autorización cuando corresponda, conocer el uso dado a su información, presentar consultas o reclamos y solicitar la revocatoria o supresión en los casos permitidos por la ley. Para ejercer estos derechos, escriba a <a href="mailto:riomayoristas@gmail.com" className="font-semibold text-rio-gold-dark underline">riomayoristas@gmail.com</a> e indique su identidad, la solicitud y un medio de respuesta. RIO tramitará la petición conforme a los plazos legales aplicables.</p></section>
          <section><h2 className="text-lg font-bold">7. Autorización y conservación</h2><p>RIO debe informar las finalidades y obtener la autorización del titular cuando sea exigible, dejando constancia consultable. Publicar esta política o iniciar sesión no reemplaza por sí solo esa autorización. Los datos se conservarán durante el tiempo necesario para la relación comercial y las obligaciones legales o contractuales aplicables; después se eliminarán o tratarán conforme a la ley y a las políticas internas que RIO apruebe.</p></section>
          <section><h2 className="text-lg font-bold">8. Vigencia y cambios</h2><p>Esta política entrará en vigor cuando RIO complete sus datos, la apruebe y publique su fecha de vigencia: [fecha]. Los cambios sustanciales se comunicarán por los medios adecuados antes de aplicarse. Consulte también los <Link href="/terminos" className="font-semibold text-rio-gold-dark underline">Términos y condiciones</Link> del portal.</p></section>
        </div>
      </article>
    </main>
  );
}
