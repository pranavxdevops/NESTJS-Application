import React from 'react'

type HeroAuthProps = {
  backgroundImage: string
}

const HeroAuth: React.FC<HeroAuthProps> = ({ backgroundImage }) => {
  return (
    <div
      className="w-full h-[248px] bg-cover bg-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    />
  )
}

export default HeroAuth
