import { useCallback, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import {
  activeDepartmentCodeOptions,
  activeDepartmentKeys,
  activeDepartmentOptions,
  activeReferralOptions,
  departmentLabelFromMaster,
  referralLabelFromMaster,
} from '@/lib/masterData'
import type { Department } from '@/mock/types'

/** Loads master departments + referral options once and exposes dropdown/label helpers. */
export function useMasterData() {
  const departments = useStore((s) => s.departments)
  const referralOptions = useStore((s) => s.referralOptions)
  const masterDataLoading = useStore((s) => s.masterDataLoading)
  const masterDataError = useStore((s) => s.masterDataError)
  const fetchMasterData = useStore((s) => s.fetchMasterData)

  useEffect(() => {
    void fetchMasterData()
  }, [fetchMasterData])

  const departmentOptions = useMemo(() => activeDepartmentOptions(departments), [departments])
  const departmentCodeOptions = useMemo(() => activeDepartmentCodeOptions(departments), [departments])
  const departmentKeys = useMemo(() => activeDepartmentKeys(departments), [departments])
  const referralSelectOptions = useMemo(() => activeReferralOptions(referralOptions), [referralOptions])

  const getDepartmentLabel = useCallback(
    (dept?: Department | string | null) => departmentLabelFromMaster(departments, dept),
    [departments],
  )

  const getReferralLabel = useCallback(
    (value?: string | number | null) => referralLabelFromMaster(referralOptions, value),
    [referralOptions],
  )

  return {
    departments,
    referralOptions,
    departmentOptions,
    departmentCodeOptions,
    departmentKeys,
    referralSelectOptions,
    getDepartmentLabel,
    getReferralLabel,
    masterDataLoading,
    masterDataError,
    reloadMasterData: fetchMasterData,
  }
}
