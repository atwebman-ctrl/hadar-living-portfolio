// ===================================================================
// Multi-tenant isolation: a school can only ever see its own data.
//
// Seeds two unrelated schools, one student each, then asserts that
// fetching student B's portfolio with school A's auth context fails,
// and that PATCHing student B with school A's auth context returns
// 404 — never silently succeeds and never leaks fields.
//
// This is the highest-value safety test in the suite: a single
// missing `school_id` filter anywhere in the read or write path
// would let one tenant see or mutate another's data, and the bug
// would be invisible until a real cross-tenant customer noticed.
// ===================================================================

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  adminClient,
  seedSchool,
  seedStudent,
  deleteSchool,
  makeAuthContext,
} from './helpers/testHarness'

const mockGetAuthContext = vi.fn()
vi.mock('@/lib/auth', () => ({
  getAuthContext: () => mockGetAuthContext(),
}))

import { getStudentPortfolio } from '@/lib/getStudentPortfolio'
import { GET as studentGET, PATCH as studentPATCH } from '@/app/api/dashboard/students/[studentId]/route'

describe('Multi-tenant isolation', () => {
  let schoolA_Id: string
  let schoolB_Id: string
  let studentA_Id: string
  let studentB_Id: string
  let ctxA: ReturnType<typeof makeAuthContext>

  beforeAll(async () => {
    const schoolA = await seedSchool('Tenant A School')
    const schoolB = await seedSchool('Tenant B School')
    schoolA_Id = schoolA.id
    schoolB_Id = schoolB.id

    const studentA = await seedStudent(schoolA_Id, { firstName: 'Alice', lastName: 'TenantA' })
    const studentB = await seedStudent(schoolB_Id, { firstName: 'Bob',   lastName: 'TenantB' })
    studentA_Id = studentA.id
    studentB_Id = studentB.id

    ctxA = makeAuthContext({ schoolId: schoolA_Id, role: 'admin' })
  })

  afterAll(async () => {
    if (schoolA_Id) await deleteSchool(schoolA_Id)
    if (schoolB_Id) await deleteSchool(schoolB_Id)
  })

  it('getStudentPortfolio refuses to return school B student under school A context', async () => {
    // Sanity: own-tenant lookup works.
    const own = await getStudentPortfolio(studentA_Id, schoolA_Id)
    expect(own.student.firstName).toBe('Alice')

    // Cross-tenant: must throw, not silently return data.
    await expect(getStudentPortfolio(studentB_Id, schoolA_Id))
      .rejects.toThrow(/not found|does not belong/i)
  })

  it('GET /api/dashboard/students/:id returns 404 when fetching another tenant\'s student', async () => {
    // Own tenant — 200.
    mockGetAuthContext.mockResolvedValueOnce(ctxA)
    const ownReq = new NextRequest(`http://localhost/api/dashboard/students/${studentA_Id}`)
    const ownRes = await studentGET(ownReq, { params: Promise.resolve({ studentId: studentA_Id }) })
    expect(ownRes.status).toBe(200)

    // Cross tenant — 404. Not 200 with empty body, not 403 with hint that the
    // resource exists. 404 collapses "does not exist" and "you can't see it"
    // into a single uninformative response.
    mockGetAuthContext.mockResolvedValueOnce(ctxA)
    const crossReq = new NextRequest(`http://localhost/api/dashboard/students/${studentB_Id}`)
    const crossRes = await studentGET(crossReq, { params: Promise.resolve({ studentId: studentB_Id }) })
    expect(crossRes.status).toBe(404)
  })

  it('PATCH /api/dashboard/students/:id refuses to mutate another tenant\'s student', async () => {
    mockGetAuthContext.mockResolvedValueOnce(ctxA)
    const req = new NextRequest(`http://localhost/api/dashboard/students/${studentB_Id}`, {
      method:  'PATCH',
      body:    JSON.stringify({ firstName: 'Hacked' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await studentPATCH(req, { params: Promise.resolve({ studentId: studentB_Id }) })
    expect(res.status).toBe(404)

    // Verify student B was not actually mutated in the DB.
    const { data: stillB } = await adminClient()
      .from('students')
      .select('first_name, school_id')
      .eq('id', studentB_Id)
      .single()
    expect(stillB?.first_name).toBe('Bob')
    expect(stillB?.school_id).toBe(schoolB_Id)
  })
})
