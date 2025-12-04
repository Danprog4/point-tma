import { useMemo } from "react";
import { User } from "~/db/schema";

interface UseFilteredPeopleOptions {
  search?: string;
  sortBy?: string;
  sex?: string;
  level?: { min: number; max: number };
  city?: string;
  isWithPhoto?: boolean;
  age?: { min: number; max: number };
}

const calculateAge = (birthday: string) => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const sortPeople = (people: User[], sortBy?: string) => {
  if (!sortBy) return people;

  return [...people].sort((a, b) => {
    switch (sortBy) {
      case "Сначала новые":
        return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      case "Сначала старые":
        return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
      default:
        return 0;
    }
  });
};

export const filterPerson = (person: User, options: UseFilteredPeopleOptions) => {
  const { search, sex, level, city, isWithPhoto, age } = options;

  // Search
  if (search) {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (person.name?.toLowerCase() || "").includes(searchLower) ||
      (person.surname?.toLowerCase() || "").includes(searchLower) ||
      (person.login?.toLowerCase() || "").includes(searchLower) ||
      (person.bio?.toLowerCase() || "").includes(searchLower);
    if (!matchesSearch) return false;
  }

  // Sex
  if (sex && sex !== "Все") {
    // Assuming sex in DB matches options or needs mapping
    // Options: "Мужчина", "Женщина"
    // DB might be "male", "female" or similar. Adjust matching logic if needed.
    // Let's assume consistent naming or simple mapping for now.
    // If DB stores 'male'/'female':
    const personSex =
      person.sex === "male"
        ? "Мужчина"
        : person.sex === "female"
          ? "Женщина"
          : person.sex;
    if (personSex !== sex) return false;
  }

  // Level
  if (level) {
    const personLevel = person.level ?? 1;
    if (personLevel < level.min || personLevel > level.max) {
      return false;
    }
  }

  // City
  if (city && city !== "Все" && person.city !== city) {
    return false;
  }

  // With Photo
  if (isWithPhoto) {
    if (!person.photo && !person.photoUrl) return false;
  }

  // Age
  if (age && person.birthday) {
    const personAge = calculateAge(person.birthday);
    if (personAge < age.min || personAge > age.max) {
      return false;
    }
  }

  return true;
};

export const useFilteredPeople = (
  people: User[],
  options: UseFilteredPeopleOptions = {},
) => {
  const filteredPeople = useMemo(() => {
    const filtered = people.filter((person) => filterPerson(person, options));
    return sortPeople(filtered, options.sortBy);
  }, [people, options]);

  return {
    people: filteredPeople,
    totalCount: people.length,
    filteredCount: filteredPeople.length,
  };
};
