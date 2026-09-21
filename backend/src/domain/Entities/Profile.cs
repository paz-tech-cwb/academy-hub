using domain.Enums;

namespace domain.Entities
{
    public class Profile
    {
        private readonly int LevelMultiplier = 75;

        public Guid PublicId { get; set; }
        public string Username { get; set; } = string.Empty;
        public long Experience { get; set; }
        public int RequiredExperienceToNextLevel => CalculateRequiredNextLevel(Experience);
        public int Level => CalculateLevel(Experience);
        public float LevelPercentage => CalculateLevelPercentage(Experience);
        public Roles Role { get; set; }

        private int CalculateRequiredNextLevel(long experience)
        {
            int requiredNextLevelValue = 1000;

            while (experience >= requiredNextLevelValue)
            {
                requiredNextLevelValue += requiredNextLevelValue + LevelMultiplier;
            }

            return requiredNextLevelValue;
        }

        private int CalculateLevel(long experience)
        {
            int level = 1;
            int requiredNextLevelValue = 1000;

            while (experience - requiredNextLevelValue >= 0)
            {
                level++;
                experience -= requiredNextLevelValue;
                requiredNextLevelValue += LevelMultiplier;
            }

            return level;
        }

        private float CalculateLevelPercentage(long experience)
        {
            int requiredNextLevelValue = 1000;

            while (experience - requiredNextLevelValue >= 0)
            {
                experience -= requiredNextLevelValue;
                requiredNextLevelValue += LevelMultiplier;
            }

            if (experience == 0) return 0;

            return 100 / (float)requiredNextLevelValue * experience;
        }
    }
}
