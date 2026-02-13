import { transformEcosystem, transformContactUs, transformHero } from './commonTransformation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { transformImage } from './transformHomepage';


export default function transformCommittees(strapiJson) {
	const data = strapiJson.data?.[0];
	if (!data) return {};

	const sections = data.contents || [];

	  const heroSection = sections.find(s => s.__component === 'sections.sections-hero');
	// Board Members section
	const committeeSection = sections.find(s => s.__component === 'sections.member-card' && s.title === 'Committee Members');
	// Committees section
	const boardMembersSection = sections.find(s => s.__component === 'sections.member-card' && s.title === 'Board Members');
	// Ecosystem section
	const ecosystem = sections.find(s => s.__component === 'home.ecosystem');
	// Contact Us section
	const contactUs = sections.find(s => s.__component === 'home.contact-us');

	return {
        title:data.title,
        slug:data.slug,
        fullpath:data.fullPath,
		description: data.description || null,
		hero: heroSection ? transformHero(heroSection) : null,
		committees: committeeSection && {
			title: committeeSection.title,
			description: committeeSection.description,
			members: committeeSection.members?.map(m => ({
				name: m.name,
				role: m.role,
				bio: m.biodata,
				type: m.type,
                slug: m.slug,
				organisationDesignation: m.organisationDesignation,
                memberUrl: data.fullPath+'/'+m.slug,
				imageUrl: transformImage(m.image),
                linkedinUrl: m.iconLink?.href || null,
			})) || [],
		},
		boardMembers: boardMembersSection && {
			title: boardMembersSection.title,
			description: boardMembersSection.description,
			members: boardMembersSection.members?.map(m => ({
				name: m.name,
				role: m.role,
				bio: m.biodata,
				type: m.type,
				memberUrl: '/about-us/board-of-directors/'+m.slug,
				imageUrl: transformImage(m.image),
                linkedinUrl: m.iconLink?.href || null,
			})) || [],
		},
		ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
		contactUs: contactUs ? transformContactUs(contactUs) : null,
	};
}
