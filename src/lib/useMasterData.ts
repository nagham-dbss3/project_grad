import { useCallback, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import {
  activeDepartmentCodeOptions,
  activeDepartmentOptions,
  activeReferralOptions,
  departmentLabelFromMaster,
} from '@/lib/masterData'
import type { Department } from '@/mock/types'

export function useMasterData() {
  const departments = useStore((s) => s.departments)
  const referralOptions = useStore((s) => s.referralOptions)
  const fetchDepartments = useStore((s) => s.fetchDepartments)
  const fetchReferralOptions = useStore((s) => s.fetchReferralOptions)

  useEffect(() => {
    void fetchDepartments()
    void fetchReferralOptions()
  }, [fetchDepartments, fetchReferralOptions])

  const departmentOptions = useMemo(() => activeDepartmentOptions(departments), [departments])
  const departmentCodeOptions = useMemo(() => activeDepartmentCodeOptions(departments), [departments])
  const referralSelectOptions = useMemo(() => activeReferralOptions(referralOptions), [referralOptions])

  const getDepartmentLabel = useCallback(
    (dept?: Department | string | null) => departmentLabelFromMaster(departments, dept),
    [departments],
  )

  return {
    departments,
    referralOptions,
    departmentOptions,
    departmentCodeOptions,
    referralSelectOptions,
    getDepartmentLabel,
  }
}
