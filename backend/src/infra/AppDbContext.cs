using domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace infra
{
    public class AppDbContext(IConfiguration _configuration) : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Unity> Unities { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Alternative> Alternatives { get; set; }
        public DbSet<Answer> Answers { get; set; }
        public DbSet<Certificate> Certificates { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            var connectionString = _configuration.GetConnectionString("MySql");
            var serverVersion = ServerVersion.AutoDetect(connectionString);
            optionsBuilder.UseMySql(connectionString, serverVersion);
        }
    }
}
