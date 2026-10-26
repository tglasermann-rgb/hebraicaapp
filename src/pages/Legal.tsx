import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FilaEnlace, Lista, Pagina, Tarjeta } from '@/components/ui'
import { CLUB } from '@/lib/brand'

const ACTUALIZADO = 'octubre 2026'

function Texto({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 text-[15px] leading-relaxed text-slate-700 [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-tinta [&_li]:ml-5 [&_li]:list-disc">{children}</div>
}

export function Ayuda() {
  return (
    <Pagina titulo="Ayuda" atras>
      <Tarjeta className="p-4">
        <p className="font-medium text-slate-900">¿Necesitas ayuda con el app?</p>
        <p className="mt-1 text-sm text-slate-600">Escríbenos y te responderemos lo antes posible.</p>
        <a href={`mailto:${CLUB.email}`} className="mt-3 inline-flex items-center gap-2 font-medium text-azul"><Mail className="h-4 w-4" />{CLUB.email}</a>
      </Tarjeta>
      <div className="mt-4">
        <Lista>
          <FilaEnlace a="/privacidad" titulo="Política de privacidad" />
          <FilaEnlace a="/terminos" titulo="Términos y condiciones de uso" />
          <FilaEnlace a="/directorio" titulo="Directorio del club" />
        </Lista>
      </div>
    </Pagina>
  )
}

export function Privacidad() {
  return (
    <Pagina titulo="Política de privacidad" atras>
      <Texto>
        <p className="text-sm text-slate-500">Última actualización: {ACTUALIZADO}</p>
        <p>
          Esta política explica cómo {CLUB.nombre} – {CLUB.lema} (“Hebraica”, “el club”) trata los datos personales de los socios que usan la aplicación <b>{CLUB.nombreApp}</b>.
        </p>
        <h3>1. Datos que tratamos</h3>
        <ul>
          <li>Datos de identificación del socio y su grupo familiar: nombre, cédula, número de acción, parentesco, fecha de nacimiento, foto, correo y teléfono, provenientes del registro de socios del club.</li>
          <li>Datos de la cuenta de la acción: cargos, pagos reportados, números de referencia y comprobantes que el socio adjunta.</li>
          <li>Uso de servicios: reservas, inscripciones, entradas, pases de invitados (nombre y cédula del invitado), solicitudes y registros de acceso al club.</li>
          <li>Datos técnicos mínimos necesarios para mantener la sesión iniciada.</li>
        </ul>
        <h3>2. Para qué los usamos</h3>
        <ul>
          <li>Identificar al socio y permitir su acceso a las instalaciones mediante el carnet digital.</li>
          <li>Gestionar el estado de cuenta, verificar pagos y prestar los servicios solicitados (reservas, actividades, eventos).</li>
          <li>Enviar avisos y notificaciones relacionados con el club.</li>
          <li>Mantener la seguridad de las instalaciones y de la comunidad.</li>
        </ul>
        <h3>3. Con quién los compartimos</h3>
        <p>No vendemos ni cedemos datos personales. Los datos se almacenan en proveedores de infraestructura en la nube contratados por el club (por ejemplo, Supabase) que actúan bajo instrucciones del club. Solo el personal autorizado del club accede a ellos según su función.</p>
        <h3>4. Biometría</h3>
        <p>Si activas el desbloqueo con Face ID o huella, la verificación la realiza tu dispositivo. El club nunca recibe ni almacena tus datos biométricos.</p>
        <h3>5. Conservación y seguridad</h3>
        <p>Conservamos los datos mientras exista la relación con el club y durante los plazos exigidos por la ley. Usamos conexiones cifradas y controles de acceso por rol.</p>
        <h3>6. Tus derechos</h3>
        <p>Puedes solicitar acceso, corrección o eliminación de tus datos y de tu cuenta del app desde <b>Perfil → Solicitar eliminación de mi cuenta</b> o escribiendo a {CLUB.email}. La eliminación de la cuenta del app no elimina tu condición de socio ni los registros que el club deba conservar por ley.</p>
        <h3>7. Menores de edad</h3>
        <p>Los datos de los hijos menores los gestiona el socio titular de la acción.</p>
        <h3>8. Contacto</h3>
        <p>Para cualquier consulta sobre privacidad: <a className="text-azul" href={`mailto:${CLUB.email}`}>{CLUB.email}</a>.</p>
      </Texto>
    </Pagina>
  )
}

export function Terminos() {
  return (
    <Pagina titulo="Términos de uso" atras>
      <Texto>
        <p className="text-sm text-slate-500">Última actualización: {ACTUALIZADO}</p>
        <p>Al usar {CLUB.nombreApp} aceptas estos términos. El app es un servicio del club para sus socios y no sustituye los estatutos ni reglamentos internos de {CLUB.nombre}, que prevalecen en caso de conflicto.</p>
        <h3>1. Cuenta</h3>
        <p>La cuenta es personal e intransferible. Eres responsable de mantener la confidencialidad de tu contraseña. El carnet digital solo puede ser usado por su titular.</p>
        <h3>2. Pagos</h3>
        <p>Los pagos reportados en el app quedan sujetos a verificación por Administración. Los pagos en bolívares se calculan a la tasa oficial del Banco Central de Venezuela (BCV) indicada por el club. El app no procesa cobros con tarjeta dentro de la aplicación.</p>
        <h3>3. Reservas, actividades y entradas</h3>
        <p>Las reservas, inscripciones y entradas están sujetas a disponibilidad y a las normas de cada instalación o departamento. Los montos asociados se cargan al estado de cuenta de la acción.</p>
        <h3>4. Invitados</h3>
        <p>El socio es responsable de sus invitados durante su permanencia en el club. Los pases son válidos solo para la fecha indicada.</p>
        <h3>5. Uso adecuado</h3>
        <p>No está permitido usar el app para fines distintos a los previstos, intentar acceder a datos de otros socios ni alterar su funcionamiento.</p>
        <h3>6. Cambios</h3>
        <p>El club puede actualizar el app y estos términos. Te avisaremos de cambios importantes.</p>
        <p className="pt-4"><Link to="/privacidad" className="text-azul">Ver política de privacidad</Link></p>
      </Texto>
    </Pagina>
  )
}
