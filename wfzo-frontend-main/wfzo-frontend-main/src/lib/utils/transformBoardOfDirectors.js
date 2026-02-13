import { transformEcosystem, transformContactUs , transformHero} from './commonTransformation';
import { transformImage } from './transformHomepage';

export default function transformBoardOfDirectors(strapiJson) {
	const data = strapiJson.data?.[0];
	if (!data) return {};

	const sections = data.contents || [];
  const hero = sections.find(s => s.__component === "sections.sections-hero");
	// Board Members section
	const boardMembersSection = sections.find(s => s.__component === 'sections.member-card' && s.title === 'Board of Directors');
	// Committees section
	const committeesSection = sections.find(s => s.__component === 'sections.member-card' && s.title === 'Committees');

	const advisorSection = sections.find(s => s.__component === 'sections.member-card' && s.title === 'Advisors');
	// Ecosystem section
	const ecosystem = sections.find(s => s.__component === 'home.ecosystem');
	// Contact Us section
	const contactUs = sections.find(s => s.__component === 'home.contact-us');

	return {
        title:data.title,
        slug:data.slug,
        fullPath:data.fullPath,
		description: data.description || null,
		hero: hero ? transformHero(hero) : null,
		boardMembers: boardMembersSection && {
			title: boardMembersSection.title,
			description: boardMembersSection.description,
			members: boardMembersSection.members?.map(m => ({
				name: m.name,
				role: m.role,
				bio: m.biodata,
				type: m.type,
                slug: m.slug,
                memberUrl: data.fullPath+'/'+m.slug,
				imageUrl: transformImage(m.image),
                linkedinUrl: m.iconLink?.href || null,
				organisationDesignation : m.organisationDesignation || null,
			})) || [],
		},
		committees: committeesSection && {
			title: committeesSection.title,
			description: committeesSection.description,
			members: committeesSection.members?.map(m => ({
				name: m.name,
				role: m.role,
				bio: m.biodata,
				type: m.type,
                memberUrl: '/about-us/board-of-directors/advisors-and-committees/'+m.slug,
				imageUrl: transformImage(m.image),
                linkedinUrl: m.iconLink?.href || null,
				organisationDesignation : m.organisationDesignation || null,
			})) || [],
		},
		advisors: advisorSection && {
			title: advisorSection.title,
			description: advisorSection.description,
			members: advisorSection.members?.map(m => ({
				name: m.name,
				role: m.role,
				bio: m.biodata,
				type: m.type,
                memberUrl: '/about-us/board-of-directors/advisors-and-committees/'+m.slug,
				imageUrl: transformImage(m.image),
                linkedinUrl: m.iconLink?.href || null,
				organisationDesignation : m.organisationDesignation || null,
			})) || [],
		},
		ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
		contactUs: contactUs ? transformContactUs(contactUs) : null,
	};
}
