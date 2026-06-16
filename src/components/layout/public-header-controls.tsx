"use client";

import NextLink from "next/link";
import { Avatar, Dropdown, DropdownDivider, DropdownHeader, DropdownItem } from "flowbite-react";

import { LocaleSwitcher } from "./locale-switcher";

export type PublicHeaderControlsLabels = {
  accountMenuLabel: string;
  accountMenuTitle: string;
  accountMenuDescription: string;
  accountDashboard: string;
  accountSettings: string;
  accountChangePasswordFuture: string;
  accountSignOutFuture: string;
  futureActionBadge: string;
};

type PublicHeaderControlsProps = {
  locale: string;
  labels: PublicHeaderControlsLabels;
};

export function PublicHeaderControls({ locale, labels }: PublicHeaderControlsProps) {
  const adminHref = `/${locale}/admin`;
  const adminSettingsHref = `/${locale}/admin/settings`;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <LocaleSwitcher />

      <Dropdown
        arrowIcon={false}
        inline
        placement="bottom-end"
        className="w-64 rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
        label={
          <div className="rounded-full border border-slate-200 bg-white p-1 shadow-sm transition hover:bg-slate-50">
            <Avatar
              rounded
              placeholderInitials="PV"
              alt={labels.accountMenuLabel}
              className="cursor-pointer bg-slate-100 text-slate-700"
            />
          </div>
        }
      >
        <DropdownHeader>
          <span className="block text-sm font-semibold text-slate-900">{labels.accountMenuTitle}</span>
          <span className="block max-w-56 text-xs text-slate-500">{labels.accountMenuDescription}</span>
        </DropdownHeader>
        <DropdownItem as={NextLink} href={adminHref}>
          {labels.accountDashboard}
        </DropdownItem>
        <DropdownItem as={NextLink} href={adminSettingsHref}>
          {labels.accountSettings}
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem className="cursor-default focus:bg-slate-50">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">{labels.accountChangePasswordFuture}</span>
            <span className="text-xs text-slate-500">{labels.futureActionBadge}</span>
          </div>
        </DropdownItem>
        <DropdownItem className="cursor-default focus:bg-slate-50">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">{labels.accountSignOutFuture}</span>
            <span className="text-xs text-slate-500">{labels.futureActionBadge}</span>
          </div>
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
