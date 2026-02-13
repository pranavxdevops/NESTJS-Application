"use client";
import { motion } from "framer-motion";
import Link from "next/link";

interface IndustryItemProps {
  name: string;
  isActive: boolean;
  isMobile?: boolean;
}

export function IndustryItem({ name, isActive, isMobile = false }: IndustryItemProps) {
  return (
    <Link href={`/membership/members-directory?industry=${encodeURIComponent(name)}#members-section`}>
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`font-montserrat font-bold text-center ${
        isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'
      } ${
        isActive ? 'text-wfzo-grey-800' : 'text-wfzo-grey-400'
      } cursor-pointer`}
    >
      {name}
    </motion.div>
    </Link>
  );
}