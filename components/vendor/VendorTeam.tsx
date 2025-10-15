import Image from "next/image";
import type { VendorTeamMember } from "@/types/vendor-profile";

type VendorTeamProps = {
  team: VendorTeamMember[];
};

function formatResponseTime(hours: number | null): string | null {
  if (!hours) return null;
  if (hours <= 24) return "Typically responds within 24 hours";
  return `Typically responds within ${hours} hours`;
}

export default function VendorTeam({ team }: VendorTeamProps) {
  if (!team.length) {
    return <p className="text-muted mb-0">Team information coming soon.</p>;
  }

  return (
    <div>
      <h2 className="h3 mb-4">Meet the Team</h2>
      <div className="row g-4">
        {team.map((member) => {
          const responseText = formatResponseTime(member.respondsWithinHours);
          return (
            <div className="col-12 col-md-6 col-lg-4" key={member.id}>
              <div className="card h-100 shadow-sm">
                {member.headshotUrl ? (
                  <div className="position-relative" style={{ height: "220px" }}>
                    <Image
                      src={member.headshotUrl}
                      alt={member.name}
                      fill
                      className="object-fit-cover rounded-top"
                    />
                  </div>
                ) : null}
                <div className="card-body">
                  <h3 className="card-title h5 mb-1">{member.name}</h3>
                  {member.title ? <p className="text-muted mb-2">{member.title}</p> : null}
                  {member.bio ? <p className="card-text">{member.bio}</p> : null}
                </div>
                {responseText ? <div className="card-footer text-success small">{responseText}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
