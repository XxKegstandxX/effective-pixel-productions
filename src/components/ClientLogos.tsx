interface Client {
  name: string
  logo: string
}

interface ClientLogosProps {
  clients: Client[]
}

export default function ClientLogos({ clients }: ClientLogosProps) {
  return (
    <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8">
      {clients.map((client, index) => (
        <div 
          key={client.name}
          className="group relative"
        >
          {/* Placeholder text - replace with actual logos */}
          <span className="text-ep-gray text-sm font-body tracking-wide transition-colors duration-300 group-hover:text-ep-white">
            {client.name}
          </span>
          {/* Hover accent line */}
          <span className="absolute -bottom-2 left-0 w-0 h-px bg-ep-accent transition-all duration-300 group-hover:w-full" />
        </div>
      ))}
    </div>
  )
}
