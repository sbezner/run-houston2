// Helper function to capitalize first letter of surface type
export const capitalizeSurface = (surface: string | null | undefined): string => {
  if (!surface) return '';
  return surface.charAt(0).toUpperCase() + surface.slice(1);
};
