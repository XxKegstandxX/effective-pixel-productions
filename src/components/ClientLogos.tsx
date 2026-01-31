import Image from 'next/image'

interface Client {
  name: string
  logo: string
}

interface ClientLogosProps {
  clients: Client[]
}

export default function ClientLogos({ clients }: ClientLogosProps) {
  return (
    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
      {clients.map((client) => (
        <div 
          key={client.name}
          className="group relative h-8 w-24 md:w-28 opacity-60 hover:opacity-100 transition-opacity duration-300"
        >
          <Image
            src={`/images/clients/${client.logo}`}
            alt={client.name}
            fill
            className="object-contain brightness-0 invert"
          />
        </div>
      ))}
    </div>
  )
}