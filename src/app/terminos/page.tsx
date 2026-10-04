import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y condiciones | RIO',
  description: 'Condiciones de uso del portal mayorista RIO.',
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-rio-background px-4 py-10 text-rio-ink sm:py-16">
      <article className="mx-auto max-w-3xl rounded-3xl border border-rio-border bg-white p-6 shadow-sm sm:p-10">
        <Link href="/login" className="text-sm font-semibold text-rio-gold-dark hover:underline">← Volver al ingreso</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-rio-gold-dark">RIO · Portal mayorista</p>
        <h1 className="mt-2 text-3xl font-bold">Términos y condiciones</h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Borrador pendiente de revisión y aprobación. RIO debe confirmar una dirección de notificaciones distinta de la bodega y revisar las condiciones comerciales con su asesoría jurídica antes de publicarlo como versión definitiva.
        </p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-rio-ink">
          <section><h2 className="text-lg font-bold">1. Responsable y alcance</h2><p>RIO ACCESORIOS Y BISUTERIA S.A.S., identificada con NIT 901.979.300-5 y domiciliada en Medellín, opera el portal RIO para la consulta de catálogo y gestión de pedidos de sus clientes mayoristas y equipo autorizado. El acceso requiere credenciales asignadas por RIO; cada usuario debe protegerlas y comunicar cualquier uso no autorizado.</p></section>
          <section><h2 className="text-lg font-bold">2. Catálogo y pedidos</h2><p>Los precios, imágenes y existencias mostrados sirven para preparar el pedido y pueden requerir verificación. Al enviar un pedido desde el portal, las unidades quedan registradas o reservadas según la disponibilidad y el estado mostrado; esto no equivale todavía a facturación ni a pago. El administrador puede confirmarlo operativamente en el panel. La confirmación comercial final ocurre cuando RIO termina de facturarlo en su sistema independiente.</p></section>
          <section><h2 className="text-lg font-bold">3. Cambios y cancelaciones</h2><p>El cliente puede solicitar cambios o cancelación por medio de su asesor comercial mientras el administrador no haya confirmado el pedido en el panel. La solicitud debe ser revisada y confirmada por RIO; enviar el mensaje no modifica por sí solo el pedido. Después de la confirmación, cualquier novedad debe consultarse con el asesor según el estado de preparación, facturación y despacho.</p></section>
          <section><h2 className="text-lg font-bold">4. Facturación y pago</h2><p>La factura se emite fuera del portal. Según las condiciones comerciales indicadas por RIO para cada cliente, el cobro suele realizarse entre 30 y 45 días después de la facturación. La fecha y condiciones exigibles serán las que consten en la factura y en el acuerdo comercial aplicable; el portal no procesa pagos.</p></section>
          <section><h2 className="text-lg font-bold">5. Envíos</h2><p>RIO prepara los pedidos para su envío a la dirección informada por el cliente. Podrá utilizar empresas transportadoras como Coordinadora, Servientrega, Envía o Inter Rapidísimo, según el destino y la operación. La transportadora específica, los costos y los tiempos de entrega deben confirmarse para cada despacho; no se garantiza una transportadora o plazo fijo desde esta página.</p></section>
          <section><h2 className="text-lg font-bold">6. Garantía y novedades</h2><p>RIO ofrece una garantía comercial de un año para defectos de fabricación o productos entregados en mal estado. No cubre daños causados por mal uso. El cliente debe comunicar la novedad a su asesor comercial, aportando el número de pedido o factura y la información necesaria para revisar el caso. Esta cláusula no limita los derechos que resulten aplicables por ley.</p></section>
          <section><h2 className="text-lg font-bold">7. Disponibilidad del portal</h2><p>RIO procura mantener el portal disponible, pero la conexión y los datos mostrados pueden interrumpirse o quedar desactualizados. Las funciones de borrador o cola sin conexión, cuando estén disponibles, conservan información en el dispositivo; un pedido en cola no se considera recibido por RIO hasta que la sincronización sea confirmada. La disponibilidad, el precio y el stock se verifican al procesarlo.</p></section>
          <section><h2 className="text-lg font-bold">8. Datos y contacto</h2><p>El uso de los datos personales se explica en la <Link href="/tratamiento-de-datos" className="font-semibold text-rio-gold-dark underline">Política de tratamiento de datos</Link>. Para consultas comerciales, cambios, cancelaciones o garantías, contacte a su asesor, escriba a <a href="mailto:riomayoristas@gmail.com" className="font-semibold text-rio-gold-dark underline">riomayoristas@gmail.com</a> o llame al <a href="tel:+573124560359" className="font-semibold text-rio-gold-dark underline">312 456 0359</a>.</p></section>
        </div>
      </article>
    </main>
  );
}
