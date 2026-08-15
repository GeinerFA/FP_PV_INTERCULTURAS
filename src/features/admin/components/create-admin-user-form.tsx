"use client";

import { useState } from "react";

import { adminPermissionActions, adminPermissionModules, type AdminPermissionAction, type AdminPermissionMatrix, type AdminPermissionModule } from "@/types/admin-user";
import { areAllAdminPermissionsGranted, createEmptyAdminPermissions, createFullAdminPermissions, updateAdminPermissionSelection } from "@/validators/admin-user";

type CreateAdminUserFormCopy = {
  disclosureHint: string;
  grantAllLabel: string;
  grantAllHint: string;
  fields: {
    email: string;
    fullName: string;
    nationalId: string;
    keepActive: string;
  };
  matrix: {
    title: string;
    description: string;
    module: string;
    superadminNote: string;
    deleteMeaning: string;
    usersDeleteMeaning: string;
    actions: Record<AdminPermissionAction, string>;
  };
  modules: Record<AdminPermissionModule, { title: string }>;
  placeholders: {
    email: string;
    fullName: string;
    nationalId: string;
  };
  actions: {
    create: string;
  };
};

type CreateAdminUserFormProps = {
  action: (formData: FormData) => Promise<void>;
  copy: CreateAdminUserFormCopy;
};

function createFilledPermissions(value: boolean): AdminPermissionMatrix {
  return value ? createFullAdminPermissions() : createEmptyAdminPermissions();
}

export function CreateAdminUserForm({ action, copy }: CreateAdminUserFormProps) {
  const [permissions, setPermissions] = useState(() => createEmptyAdminPermissions());
  const grantAllPermissions = areAllAdminPermissionsGranted(permissions);

  function handleGrantAllPermissionsChange(checked: boolean): void {
    setPermissions(createFilledPermissions(checked));
  }

  function handlePermissionChange(module: AdminPermissionModule, action: AdminPermissionAction, checked: boolean): void {
    setPermissions((currentPermissions) => {
      return updateAdminPermissionSelection(currentPermissions, module, action, checked) satisfies AdminPermissionMatrix;
    });
  }

  return (
    <form action={action} className="space-y-5">
      <p className="text-sm leading-7 text-slate-600">{copy.disclosureHint}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.fields.email}</span>
          <input name="email" className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition" placeholder={copy.placeholders.email} />
        </label>
        <label className="block space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.fields.fullName}</span>
          <input name="fullName" className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition" placeholder={copy.placeholders.fullName} />
        </label>
        <label className="block space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.fields.nationalId}</span>
          <input name="nationalId" className="admin-inner-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm outline-none transition" placeholder={copy.placeholders.nationalId} />
        </label>
      </div>

      <label className="inline-flex items-center gap-3 text-sm text-slate-700">
        <input type="checkbox" name="active" defaultChecked className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
        <span>{copy.fields.keepActive}</span>
      </label>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{copy.matrix.title}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{copy.matrix.description}</p>
        </div>

        <div className="overflow-x-auto rounded-[24px] border border-emerald-900/8 bg-white/80">
          <div className="space-y-2 border-b border-emerald-900/8 px-4 py-4">
            <label className="inline-flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="grantAllPermissions"
                checked={grantAllPermissions}
                onChange={(event) => handleGrantAllPermissionsChange(event.currentTarget.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              <span>{copy.grantAllLabel}</span>
            </label>
            <p className="text-sm leading-7 text-slate-600">{copy.grantAllHint}</p>
          </div>

          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-emerald-900/8 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <th className="px-4 py-3 font-semibold">{copy.matrix.module}</th>
                {adminPermissionActions.map((action) => (
                  <th key={action} className="px-4 py-3 font-semibold">
                    {copy.matrix.actions[action]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminPermissionModules.map((module) => (
                <tr key={module} className="border-b border-emerald-900/8 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{copy.modules[module].title}</td>
                  {adminPermissionActions.map((action) => {
                    const fieldName = `permissions.${module}.${action}`;
                    const isRequiredPermission = module === "dashboard" && action === "view";

                    return (
                      <td key={fieldName} className="px-4 py-3">
                        <label className="inline-flex items-center gap-2 text-slate-700">
                          <input
                            type="checkbox"
                            name={fieldName}
                            checked={permissions[module][action]}
                            onChange={(event) => handlePermissionChange(module, action, event.currentTarget.checked)}
                            disabled={isRequiredPermission}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                          />
                          <span className="sr-only">{`${copy.modules[module].title} ${copy.matrix.actions[action]}`}</span>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm leading-7 text-slate-600">{copy.matrix.superadminNote}</p>
        <p className="text-sm leading-7 text-slate-600">{copy.matrix.deleteMeaning}</p>
        <p className="text-sm leading-7 text-slate-600">{copy.matrix.usersDeleteMeaning}</p>
      </div>

      <button type="submit" className="admin-primary-action inline-flex rounded-full px-5 py-3 text-sm font-semibold transition">
        {copy.actions.create}
      </button>
    </form>
  );
}
