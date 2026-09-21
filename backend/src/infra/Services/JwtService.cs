using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using domain.Interfaces.Services;
using domain.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace infra.Services
{
    public class JwtService(IConfiguration _configuration) : IJwtService
    {
        public string GenerateBearerToken(User user)
        {
            var key = _configuration["JwtConfig:Key"]!;

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(
                [
                    new Claim(JwtRegisteredClaimNames.Nickname, user.Username),
                    new Claim(JwtRegisteredClaimNames.NameId, user.PublicId.ToString()),
                    new Claim(ClaimTypes.Role, user.Role.ToString()),
                ]),
                Expires = GetExpirationDate(),
                Issuer = _configuration["JwtConfig:Issuer"],
                Audience = _configuration["JwtConfig:Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(Encoding.ASCII.GetBytes(key)),
                    SecurityAlgorithms.HmacSha256Signature
                    )
            };


            var tokenHandler = new JwtSecurityTokenHandler();
            var securityToken = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(securityToken);
        }

        public DateTime GetExpirationDate() => DateTime.UtcNow.AddMinutes(_configuration.GetValue<int>("JwtConfig:TokenValidityMins"));
    }
}