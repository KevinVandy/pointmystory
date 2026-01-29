import {
  Avatar,
  AvatarGroup,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
} from "@/components/ui/avatar";

export function CollaborationAvatars() {
  // Demo avatars with status dots using local stock avatars
  const avatars = [
    {
      name: "Alex",
      initial: "A",
      online: true,
      image: "/stock-avatars/avatar1.png",
    },
    {
      name: "Sam",
      initial: "S",
      online: true,
      image: "/stock-avatars/avatar2.png",
    },
    {
      name: "Jordan",
      initial: "J",
      online: false,
      image: "/stock-avatars/avatar3.png",
    },
    {
      name: "Taylor",
      initial: "T",
      online: true,
      image: "/stock-avatars/avatar4.png",
    },
    {
      name: "Morgan",
      initial: "M",
      online: true,
      image: "/stock-avatars/avatar5.png",
    },
  ];

  return (
    <AvatarGroup className="justify-center">
      {avatars.map((avatar, index) => (
        <Avatar key={index} size="lg">
          <AvatarImage src={avatar.image} alt={avatar.name} />
          <AvatarFallback>{avatar.initial}</AvatarFallback>
          <AvatarBadge
            className={
              avatar.online
                ? "bg-green-500 border-green-500"
                : "bg-gray-400 border-gray-400"
            }
          />
        </Avatar>
      ))}
    </AvatarGroup>
  );
}
