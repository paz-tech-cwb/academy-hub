using domain.Entities;
using domain.Enums;

namespace domain.tests.Entities;

public class ProfileEntityTests
{
    private static Profile BuildProfile(long experience) => new()
    {
        PublicId = Guid.NewGuid(),
        Username = "test",
        Experience = experience
    };

    [Fact]
    public void Level_WithZeroExperience_ReturnsOne()
    {
        var profile = BuildProfile(0);
        Assert.Equal(1, profile.Level);
    }

    [Fact]
    public void Level_WithExactFirstThreshold_ReturnsTwo()
    {
        // First level requires 1000 XP
        var profile = BuildProfile(1000);
        Assert.Equal(2, profile.Level);
    }

    [Fact]
    public void Level_IncreasesWithExperience()
    {
        var low = BuildProfile(0);
        var high = BuildProfile(5000);
        Assert.True(high.Level > low.Level);
    }

    [Fact]
    public void RequiredExperienceToNextLevel_WithZeroExperience_Returns1000()
    {
        var profile = BuildProfile(0);
        Assert.Equal(1000, profile.RequiredExperienceToNextLevel);
    }

    [Fact]
    public void RequiredExperienceToNextLevel_GrowsAsLevelIncreases()
    {
        var level1 = BuildProfile(0);
        var level2 = BuildProfile(1000);
        Assert.True(level2.RequiredExperienceToNextLevel > level1.RequiredExperienceToNextLevel);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1784)]
    [InlineData(2075)]
    [InlineData(5000)]
    [InlineData(20000)]
    public void RequiredExperienceToNextLevel_IsWhereTheLevelGoesUp(long experience)
    {
        var current = BuildProfile(experience);
        var oneBelow = BuildProfile(current.RequiredExperienceToNextLevel - 1);
        var atThreshold = BuildProfile(current.RequiredExperienceToNextLevel);

        Assert.Equal(current.Level, oneBelow.Level);
        Assert.Equal(current.Level + 1, atThreshold.Level);
    }

    [Fact]
    public void LevelPercentage_WithZeroExperience_ReturnsZero()
    {
        var profile = BuildProfile(0);
        Assert.Equal(0f, profile.LevelPercentage);
    }

    [Fact]
    public void LevelPercentage_WithHalfFirstLevelExperience_ReturnsApproximately50()
    {
        var profile = BuildProfile(500);
        Assert.Equal(50f, profile.LevelPercentage, precision: 1);
    }

    [Fact]
    public void LevelPercentage_IsAlwaysBetweenZeroAnd100()
    {
        long[] samples = [0, 250, 500, 999, 1000, 2000, 10000];
        foreach (var xp in samples)
        {
            var profile = BuildProfile(xp);
            Assert.InRange(profile.LevelPercentage, 0f, 100f);
        }
    }

    [Fact]
    public void Role_DefaultsToUser()
    {
        var profile = new Profile();
        Assert.Equal(Roles.User, profile.Role);
    }

    [Fact]
    public void Role_CanBeSetToAdmin()
    {
        var profile = new Profile { Role = Roles.Admin };
        Assert.Equal(Roles.Admin, profile.Role);
    }
}
