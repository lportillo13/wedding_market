export type DeletionJob = {id:string;user_id:string|null;contact_email:string|null;language:'en'|'es';status:string};
type DeletionDependencies = {
  purge: (id:string)=>Promise<void>;
  cleanMedia: (id:string)=>Promise<boolean>;
  deleteAuth: (userId:string)=>Promise<void>;
  confirmByEmail: (job:DeletionJob)=>Promise<boolean>;
  finish: (id:string)=>Promise<void>;
};

/** Every external step is idempotent. An incomplete provider step never marks deletion complete. */
export async function processDeletion(job:DeletionJob,actorId:string,finalReview:boolean,deps:DeletionDependencies) {
  if (job.status==='completed') return 'completed';
  if (!job.user_id || job.user_id===actorId) throw new Error('Another verified administrator must process this request.');
  await deps.purge(job.id);
  if (!await deps.cleanMedia(job.id)) return 'media-pending';
  await deps.deleteAuth(job.user_id);
  // Operator confirms CDN invalidation and any applicable retention exception before notifying the person.
  if (!finalReview) return 'review-required';
  if (!await deps.confirmByEmail(job)) return 'email-pending';
  await deps.finish(job.id);
  return 'completed';
}
