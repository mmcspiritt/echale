export const storyFraming = {
  adrian: {
    coverFocus: "50% 32%",
    posterLine: "Ayúdale a volver a Guanajuato",
    blurDataURL: "data:image/webp;base64,UklGRoIAAABXRUJQVlA4IHYAAACwAwCdASoQABQAPu1iqU2ppaOiMAgBMB2JZwC7ACD0BmMMrHliAAD+g+7Hpu2vj9JZVJeevDo1KcLCuw10CEIWvu0lOmPWvV6lh64nGddVbtGKwmsHXU6uXRLZYWaIwxI9Mf9ezHTx9jXXrQ9yxptTt9ZjESgA",
  },
  santiago: {
    coverFocus: "28% 62%",
    posterFocus: "28% 36%",
    posterLine: "Ayúdale a recuperar la rodilla",
    blurDataURL: "data:image/webp;base64,UklGRooAAABXRUJQVlA4IH4AAABQBACdASoQABQAPu1iqU2ppaOiMAgBMB2JZQC1GoACfFZfMg/lw5klDYPAAPhClb7dmf8Ba2RkWrLC+ZnbeWRtBlTpDF1fI/s7h1Ntvd0tTEmzhYm5ddOXfLxEAOMsZmul4UJBDTFnJXtyzeHriihT1gpChX9dK1LFkRChQAA=",
  },
  miriam: {
    coverFocus: "46% 58%",
    posterLine: "Ayúdale a reconstruir su casa",
    blurDataURL: "data:image/webp;base64,UklGRpIAAABXRUJQVlA4IIYAAAAQBACdASoQABQAPu1iqU2ppaOiMAgBMB2JYwCdABSQegLdzS/U8WfjQAD+qOG0CPC2UxdLZTZmB22niehCQN60cDPxDiePdQR27GjtLxelsEhPyQ+U/FNwfmO+ppIT0OkiCySRUQL2f6yDtEhn+RAIXs6CLjecMPQjtKXUE8A2dWYDERgAAA==",
  },
} as const;

export const homeHeroBlur = {
  portrait: "data:image/webp;base64,UklGRpoAAABXRUJQVlA4II4AAADwAwCdASoQABQAPu1iqU2ppaOiMAgBMB2JYgCw7Bb47l6mvg2ndBIAAMyhahE0wId1KDNng+1Cbq0nSjp+JLUCBnsWjNPWDsO2xgzC3bL1h2y66TkmEzzlCvzEHciKR8k9TRII9XSatrnvA8M6NPGq/Z3aEf3XIi6ZJfxUBEVUHvwZF9mzGeXObMZ4gAAA",
  wide: "data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAADwAQCdASoQAAsAA4BaJZACdADHYxYPvoAA9qwfXX0udt9vjnGrvu3QrZ+nfK0ztFcFHDZse4swfUkL7uQq9Ro3D5fGYNCJYlKAAd+aJTqqSIk8IR4joyuYyjZpdl7EAAA=",
} as const;

export function framingForSlug(slug: string) {
  return storyFraming[slug as keyof typeof storyFraming] ?? {
    coverFocus: "50% 40%",
    posterLine: "",
    blurDataURL: "data:image/webp;base64,UklGRpoAAABXRUJQVlA4II4AAADwAwCdASoQABQAPu1iqU2ppaOiMAgBMB2JYgCw7Bb47l6mvg2ndBIAAMyhahE0wId1KDNng+1Cbq0nSjp+JLUCBnsWjNPWDsO2xgzC3bL1h2y66TkmEzzlCvzEHciKR8k9TRII9XSatrnvA8M6NPGq/Z3aEf3XIi6ZJfxUBEVUHvwZF9mzGeXObMZ4gAAA",
  };
}
