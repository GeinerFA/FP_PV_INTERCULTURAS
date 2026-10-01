import { getTranslations } from "next-intl/server";

import { AdminRowDetailsToggle } from "./admin-row-details-toggle";

/** Última celda de las filas de tablas del admin: botón "Ver detalle" solo en la vista de tarjetas. */
export async function AdminRowDetailsCell() {
  const t = await getTranslations("AdminTableDetails");

  return (
    <td data-cell="toggle" className="xl:hidden">
      <AdminRowDetailsToggle showLabel={t("show")} hideLabel={t("hide")} />
    </td>
  );
}
