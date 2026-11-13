import React from 'react';
import { requireAdminSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { GraduationCap, Users, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmDelete } from '@/components/ui/confirm-delete';
import { deleteCourseAction } from '@/lib/actions/admin-delete';
import { pluralize } from '@/lib/utils/admin-delete-guards';

export const dynamic = 'force-dynamic';

export default async function AdminLearningPage() {
  await requireAdminSession();

  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { track: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <GraduationCap className="h-6 w-6 text-cyan-400" />
          <span>Partner Learning & Course Management</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor course curriculum, completion rates across partner tracks, and technical enablement progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={course.track === 'Technical' ? 'info' : 'warning'} size="sm">
                  {course.track} Track
                </Badge>
                <span className="text-xs text-slate-400 font-medium">{course.level}</span>
              </div>
              <h3 className="text-base font-bold text-white">{course.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{course.description}</p>
            </div>

            <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>{course.duration_minutes} Mins &bull; {course.modules_count} Modules</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-mono font-semibold text-cyan-400">
                  {course._count.enrollments} Partner Enrollments
                </div>
                <ConfirmDelete
                  iconOnly
                  title="Delete course"
                  entityName={course.title}
                  impacts={[pluralize(course._count.enrollments, 'enrollment') + ' and their progress']}
                  action={deleteCourseAction.bind(null, course.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
