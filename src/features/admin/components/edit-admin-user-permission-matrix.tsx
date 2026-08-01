"use client";

import { useState } from "react";

import { adminPermissionActions, adminPermissionModules, type AdminPermissionAction, type AdminPermissionMatrix, type AdminPermissionModule } from "@/types/admin-user";
import { areAllAdminPermissionsGranted, createEmptyAdminPermissions, createFullAdminPermissions, updateAdminPermissionSelection } from "@/validators/admin-user";

type EditAdminUserPermissionMatrixProps = {
  actionLabels: Record<AdminPermissionAction, string>;
  description: string;
  disabled?: boolean;
  grantAllHint: string;
  grantAllLabel: string;
  moduleLabel: string;
  moduleTitles: Record<AdminPermissionModule, string>;
  permissions: AdminPermissionMatrix;
};

export function EditAdminUserPermissionMatrix({
  actionLabels,
  description,
  disabled = false,
  grantAllHint,
  grantAllLabel,
  moduleLabel,
  moduleTitles,
  permissions: initialPermissions,
}: EditAdminUserPermissionMatrixProps) {
  const [permissions, setPermissions] = useState(initialPermissions);
  const grantAllPermissions = areAllAdminPermissionsGranted(permissions);

  function handleGrantAllPermissionsChange(checked: boolean): void {
    setPermissions(checked ? createFullAdminPermissions() : createEmptyAdminPermissions());
  }

  function handlePermissionChange(module: AdminPermissionModule, action: AdminPermissionAction, checked: boolean): void {
    setPermissions((currentPermissions) => updateAdminPermissionSelection(currentPermissions, module, action, checked));
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-emerald-900/8 bg-white/80">
      <div className="space-y-2 border-b border-emerald-900/8 px-4 py-4">
        <label className="inline-flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="grantAllPermissions"
            checked={grantAllPermissions}
            onChange={(event) => handleGrantAllPermissionsChange(event.currentTarget.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 disabled:opacity-60"
          />
          <span>{grantAllLabel}</span>
        </label>
        <p className="text-sm leading-7 text-slate-600">{grantAllHint}</p>
      </div>

      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-emerald-900/8 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <th className="px-4 py-3 font-semibold">{moduleLabel}</th>
            {adminPermissionActions.map((action) => (
              <th key={action} className="px-4 py-3 font-semibold">
                {actionLabels[action]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {adminPermissionModules.map((module) => (
            <tr key={module} className="border-b border-emerald-900/8 last:border-b-0">
              <td className="px-4 py-3 font-medium text-slate-900">{moduleTitles[module]}</td>
              {adminPermissionActions.map((action) => {
                const fieldName = `permissions.${module}.${action}`;

                return (
                  <td key={fieldName} className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-slate-700">
                      <input
                        type="checkbox"
                        name={fieldName}
                        checked={permissions[module][action]}
                        onChange={(event) => handlePermissionChange(module, action, event.currentTarget.checked)}
                        disabled={disabled}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 disabled:opacity-60"
                      />
                      <span className="sr-only">{`${moduleTitles[module]} ${description} ${actionLabels[action]}`}</span>
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
