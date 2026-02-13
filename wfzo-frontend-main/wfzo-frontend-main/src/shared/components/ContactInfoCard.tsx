import { JSX } from 'react';
import Image from 'next/image';
import { Mail, Phone, Globe, Printer,  } from 'lucide-react';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';

type ContactType = 'email' | 'phone' | 'address' | 'website' | 'fax';

interface ContactItem {
  type: ContactType;
  value: string;
}
interface ContactSectionType {
  title: string;
  items: ContactItem[];
}
interface ContactInfoProps {
  image: string;
  alt: string;
  sections: ContactSectionType[];
}

const iconMap: Record<ContactType, JSX.Element> = {
  email: <Mail className="w-5 h-5 text-gray-700" />,
  phone: <Phone className="w-5 h-5 text-gray-700" />,
  fax: <Printer className="w-5 h-5 text-gray-700" />,  
  website: <Globe className="w-5 h-5 text-gray-700" />,
  address: <></>,
};

const labelMap: Record<ContactType, string> = {
  email: 'E-mail Address',
  phone: 'Phone Number',
  fax: 'Fax',
  website: 'Website',
  address: '',
};

const ContactInfoCard = ({ image = FALLBACK_IMAGE, alt, sections=[] }: ContactInfoProps) => (
  <section className="w-full px-5 md:px-30 py-10 md:py-20 flex justify-center lg:justify-start">
    <div className="grid lg:grid-cols-2 gap-y-8 gap-x-10 w-full">
      <div className="relative w-full aspect-[620/320] rounded-[40px] overflow-hidden mx-auto lg:mx-0">
        <Image src={image} alt={alt} fill className="object-cover object-top" priority />
      </div>

      <div className="flex flex-col gap-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xl md:text-2xl font-bold text-gray-700 mb-2">{section.title}</h3>
            <ul className="space-y-2 font-source">
              {section.items.map((item, i) => (
                <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {item.type !== 'address' && (
                    <div className="flex items-center gap-2 pt-0.5">
                      {iconMap[item.type]}
                      <span className="text-gray-500 text-sm">
                        {labelMap[item.type]}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:gap-2">
                    {(Array.isArray(item.value) ? item.value : [item.value]).map((v, idx) =>
                      item.type === 'email' ? (
                        <a key={idx} href={`mailto:${v}`} className="hover:text-gray-500">
                          {v}
                        </a>
                      ) : item.type === 'phone' ? (
                        <a key={idx} href={`tel:${v}`} className="hover:text-gray-500">
                          {v}
                        </a>
                      ) : item.type === 'fax' ? (
                        <a key={idx} href={`tel:${v}`} className="hover:text-gray-500">
                          {v}
                        </a>
                      ) : item.type === 'website' ? (
                        <a
                          key={idx}
                          href={v}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-gray-500"
                        >
                          {v}
                        </a>
                      ) : (
                        <span key={idx}>{v}</span>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ContactInfoCard;