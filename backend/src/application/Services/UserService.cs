using System.Net;
using application.Dtos;
using domain.Dtos;
using domain.Enums;
using domain.Interfaces.Repositories;
using domain.Interfaces.Services;
using domain.Models;
using static BCrypt.Net.BCrypt;

namespace application.Services
{
    public class UserService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ICapabilityResolver capabilityResolver,
        IJwtService jwtService,
        IImageProcessor imageProcessor,
        IRemoteImageDownloader remoteImageDownloader,
        ProfilePicService profilePicService)
    {
        public async Task<PaginatedResult<UserListResponse>> GetUsersAsync(int page, int pageSize, string? search, bool? status, Guid? rolePublicId)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var users = await userRepository.GetListAsync(u => true);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                users = users.Where(u => u.Username.ToLowerInvariant().Contains(term)).ToList();
            }

            if (status.HasValue)
                users = users.Where(u => u.Status == status.Value).ToList();

            var roles = await roleRepository.GetListAsync(r => true);
            var rolesById = roles.ToDictionary(r => r.Id);

            if (rolePublicId.HasValue)
            {
                // Função inexistente filtra para lista vazia, em vez de
                // silenciosamente ignorar o filtro.
                var filter = roles.FirstOrDefault(r => r.PublicId == rolePublicId.Value);
                users = filter is null ? [] : users.Where(u => (int)u.Role == filter.Id).ToList();
            }

            var totalCount = users.Count;
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var items = users
                .OrderBy(u => u.Username)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u =>
                {
                    rolesById.TryGetValue((int)u.Role, out var userRole);

                    return new UserListResponse
                    {
                        PublicId = u.PublicId,
                        Username = u.Username,
                        Experience = u.Experience,
                        Status = u.Status,
                        Role = u.Role,
                        RolePublicId = userRole?.PublicId,
                        RoleName = userRole?.Name ?? u.Role.ToString()
                    };
                })
                .ToList();

            return new PaginatedResult<UserListResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };
        }

        public async Task<PaginatedResult<LeaderboardResponse>> GetLeaderboardAsync(int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var users = await userRepository.GetListAsync(u => u.Status);

            // Username como desempate para que a paginação não repita nem pule
            // usuários quando vários têm o mesmo XP.
            var ranked = users
                .OrderByDescending(u => u.Experience)
                .ThenBy(u => u.Username)
                .ToList();

            var totalCount = ranked.Count;
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            var offset = (page - 1) * pageSize;

            var items = ranked
                .Skip(offset)
                .Take(pageSize)
                .Select((user, index) => new LeaderboardResponse
                {
                    Position = offset + index + 1,
                    PublicId = user.PublicId,
                    Username = user.Username,
                    Experience = user.Experience,
                    ProfilePicUrl = user.ProfilePicUrl
                })
                .ToList();

            return new PaginatedResult<LeaderboardResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };
        }

        public async Task<bool> DeleteUserAsync(Guid publicId)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return false;

            await userRepository.DeleteAsync(user);
            capabilityResolver.Invalidate();
            return true;
        }

        public async Task<bool> ResetPasswordAsync(Guid publicId, string newPassword)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return false;

            user.Password = HashPassword(newPassword);
            await userRepository.UpdateAsync(user);
            return true;
        }

        public async Task<ChangePasswordResult> ChangeOwnPasswordAsync(Guid publicId, string currentPassword, string newPassword)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return ChangePasswordResult.UserNotFound;

            if (!Verify(currentPassword, user.Password)) return ChangePasswordResult.InvalidCurrentPassword;

            user.Password = HashPassword(newPassword);
            await userRepository.UpdateAsync(user);
            return ChangePasswordResult.Success;
        }

        public async Task<bool> DeactivateUserAsync(Guid publicId)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return false;

            user.Status = false;
            await userRepository.UpdateAsync(user);
            capabilityResolver.Invalidate();
            return true;
        }

        public async Task<bool> UpdateUserAsync(Guid publicId, bool? status, Guid? rolePublicId)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return false;

            if (rolePublicId.HasValue)
            {
                var role = await roleRepository.GetAsync(r => r.PublicId == rolePublicId.Value);
                if (role is null) return false;

                // roles.id e o enum carregam os mesmos valores, então o cast
                // também cobre as funções criadas em runtime, que não têm nome
                // no enum.
                user.Role = (Roles)role.Id;
            }

            if (status.HasValue) user.Status = status.Value;

            await userRepository.UpdateAsync(user);
            capabilityResolver.Invalidate();
            return true;
        }

        /// <summary>
        /// Busca os dados editáveis do perfil do próprio usuário.
        /// </summary>
        /// <param name="publicId">PublicId do usuário autenticado.</param>
        /// <returns>Os dados do perfil, ou <c>null</c> se o usuário não existir.</returns>
        public async Task<MyProfileResponse?> GetOwnProfileAsync(Guid publicId)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return null;

            return new MyProfileResponse
            {
                ProfilePicUrl = user.ProfilePicUrl,
                AboutMe = user.AboutMe,
                Instagram = user.Instagram,
                Email = user.Email
            };
        }

        /// <summary>
        /// Atualiza o "sobre mim", o Instagram e o e-mail do próprio usuário. Valores vazios ficam nulos.
        /// </summary>
        /// <param name="publicId">PublicId do usuário autenticado.</param>
        /// <param name="aboutMe">Texto de apresentação.</param>
        /// <param name="instagram">Identificador ou endereço do perfil no Instagram.</param>
        /// <param name="email">E-mail do usuário.</param>
        /// <returns><c>false</c> se o usuário não existir.</returns>
        public async Task<bool> UpdateOwnProfileAsync(Guid publicId, string? aboutMe, string? instagram, string? email)
        {
            var user = await GetUserAsync(publicId);
            if (user is null) return false;

            user.AboutMe = EmptyToNull(aboutMe);
            user.Instagram = EmptyToNull(instagram);
            user.Email = EmptyToNull(email);
            await userRepository.UpdateAsync(user);
            return true;
        }

        /// <summary>
        /// Cria um novo usuário ativo com o papel <c>User</c> e já gera o token de acesso, para que ele
        /// entre sem precisar fazer login.
        /// </summary>
        /// <param name="username">Nome de usuário desejado; é normalizado para minúsculas.</param>
        /// <param name="password">Senha em texto plano, armazenada como hash.</param>
        /// <returns>201 com o token de acesso, ou 409 quando o username já está em uso.</returns>
        public async Task<UseCaseResult<LoginResponseDto>> RegisterAsync(string username, string password)
        {
            var normalizedUsername = username.ToLower();

            var userAlreadyExists = await userRepository.GetAsync(u => u.Username == normalizedUsername) != null;

            if (userAlreadyExists)
                return new()
                {
                    StatusCode = HttpStatusCode.Conflict,
                    Content = new() { Message = "Usuário já existe." }
                };

            var user = await userRepository.InsertAsync(new User()
            {
                Username = normalizedUsername,
                Password = HashPassword(password),
                Status = true,
                Role = Roles.User,
            });

            return new()
            {
                StatusCode = HttpStatusCode.Created,
                Content = new LoginResponseDto()
                {
                    IsLogged = true,
                    AccessToken = jwtService.GenerateBearerToken(user),
                    Username = user.Username,
                    ExpiresIn = jwtService.GetExpirationDate(),
                    Message = "Usuário criado com sucesso."
                },
            };
        }

        /// <summary>
        /// Confere o username e a senha e gera o token de acesso. Usuário inexistente, inativo ou com
        /// senha errada recebem a mesma resposta.
        /// </summary>
        /// <param name="username">Nome de usuário; a busca ignora maiúsculas.</param>
        /// <param name="password">Senha em texto plano.</param>
        /// <returns>200 com o token de acesso, ou 401 quando as credenciais não conferem.</returns>
        public async Task<UseCaseResult<LoginResponseDto>> LoginAsync(string username, string password)
        {
            var normalizedUsername = username.ToLower();

            var userFromDatabase = await userRepository.GetAsync(u => u.Username == normalizedUsername);

            if (userFromDatabase is null || !Verify(password, userFromDatabase.Password))
                return new()
                {
                    Content = new()
                    {
                        Message = "E-mail ou senha incorretos",
                    },
                    StatusCode = HttpStatusCode.Unauthorized
                };

            return new()
            {
                Content = new LoginResponseDto()
                {
                    IsLogged = true,
                    AccessToken = jwtService.GenerateBearerToken(userFromDatabase),
                    Username = userFromDatabase.Username,
                    ExpiresIn = jwtService.GetExpirationDate(),
                    Message = "Successfully logged."
                },
            };
        }

        /// <summary>
        /// Define a foto de perfil do usuário a partir de uma imagem já recortada em quadrado pelo
        /// front. Imagens maiores que 512x512 são reduzidas antes de irem para o bucket.
        /// </summary>
        /// <param name="userPublicId">PublicId do usuário.</param>
        /// <param name="content">Bytes do arquivo enviado.</param>
        /// <returns>200 com a nova URL, 400 com o motivo da recusa ou 404 se o usuário não existir.</returns>
        public async Task<UseCaseResult<object>> UploadProfilePicAsync(Guid userPublicId, byte[] content)
        {
            var user = await userRepository.GetAsync(u => u.PublicId == userPublicId);
            if (user is null) return new() { StatusCode = HttpStatusCode.NotFound };

            if (content.Length > ProfilePicService.MaxPicBytes)
                return BadRequest(ProfilePicService.TooLargeMessage);

            var info = imageProcessor.Inspect(content);
            if (info is null) return BadRequest(ProfilePicService.InvalidFormatMessage);
            if ((long)info.Width * info.Height > ProfilePicService.MaxPixels)
                return BadRequest(ProfilePicService.TooManyPixelsMessage);
            if (!ProfilePicService.IsSquare(info.Width, info.Height))
                return BadRequest(ProfilePicService.WrongRatioMessage);

            if (info.Width > ProfilePicService.MaxSize || info.Height > ProfilePicService.MaxSize)
                content = imageProcessor.CropAndResize(content, null, ProfilePicService.MaxSize, ProfilePicService.MaxSize, info.Format);

            return await SaveProfilePicAsync(user, content, info.Format);
        }

        /// <summary>
        /// Baixa uma imagem da internet, recorta na área quadrada escolhida no front, reduz para no
        /// máximo 512x512 e grava como foto de perfil do usuário.
        /// </summary>
        /// <param name="userPublicId">PublicId do usuário.</param>
        /// <param name="url">URL pública da imagem.</param>
        /// <param name="crop">Área de recorte em pixels da imagem original.</param>
        /// <returns>200 com a nova URL, 400 com o motivo da recusa ou 404 se o usuário não existir.</returns>
        public async Task<UseCaseResult<object>> SetProfilePicFromUrlAsync(Guid userPublicId, Uri url, ImageCrop crop)
        {
            var user = await userRepository.GetAsync(u => u.PublicId == userPublicId);
            if (user is null) return new() { StatusCode = HttpStatusCode.NotFound };

            var content = await remoteImageDownloader.DownloadAsync(url, ProfilePicService.MaxDownloadBytes);
            if (content is null) return BadRequest(ProfilePicService.DownloadFailedMessage);

            var info = imageProcessor.Inspect(content);
            if (info is null) return BadRequest(ProfilePicService.InvalidFormatMessage);
            if ((long)info.Width * info.Height > ProfilePicService.MaxPixels)
                return BadRequest(ProfilePicService.TooManyPixelsMessage);

            var clamped = crop.ClampTo(info);
            if (clamped is null) return BadRequest(ProfilePicService.CropOutOfBoundsMessage);
            if (!ProfilePicService.IsSquare(clamped.Width, clamped.Height))
                return BadRequest(ProfilePicService.WrongRatioMessage);

            var format = info.Format;
            var processed = imageProcessor.CropAndResize(content, clamped, ProfilePicService.MaxSize, ProfilePicService.MaxSize, format);

            // Em 512x512 dificilmente passa de 2 MB, mas um PNG muito detalhado ainda pode; WebP fica bem menor.
            if (processed.Length > ProfilePicService.MaxPicBytes && format == ImageFormat.Png)
            {
                format = ImageFormat.Webp;
                processed = imageProcessor.CropAndResize(content, clamped, ProfilePicService.MaxSize, ProfilePicService.MaxSize, format);
            }
            if (processed.Length > ProfilePicService.MaxPicBytes)
                return BadRequest(ProfilePicService.TooLargeMessage);

            return await SaveProfilePicAsync(user, processed, format);
        }

        /// <summary>
        /// Remove a foto de perfil do usuário e deixa <c>profile_pic_url</c> nula. Usuários sem
        /// foto também retornam sucesso.
        /// </summary>
        /// <param name="userPublicId">PublicId do usuário.</param>
        /// <returns>204 em caso de sucesso ou 404 se o usuário não existir.</returns>
        public async Task<UseCaseResult<object>> RemoveProfilePicAsync(Guid userPublicId)
        {
            var user = await userRepository.GetAsync(u => u.PublicId == userPublicId);
            if (user is null) return new() { StatusCode = HttpStatusCode.NotFound };

            if (!string.IsNullOrWhiteSpace(user.ProfilePicUrl))
            {
                await profilePicService.RemoveAsync(user);

                user.ProfilePicUrl = null;
                await userRepository.UpdateAsync(user);
            }

            return new() { StatusCode = HttpStatusCode.NoContent };
        }

        /// <summary>
        /// Soma pontos de experiência ao usuário.
        /// </summary>
        /// <param name="publicId">PublicId do usuário.</param>
        /// <param name="experience">Quantidade de XP a somar.</param>
        public Task AddExperienceAsync(Guid publicId, int experience)
            => userRepository.AddExperience(experience, publicId);

        /// <summary>
        /// Remove espaços nas pontas e converte texto vazio em <c>null</c>.
        /// </summary>
        /// <param name="value">Valor informado pelo usuário.</param>
        /// <returns>O valor sem espaços nas pontas, ou <c>null</c> se ficar vazio.</returns>
        private static string? EmptyToNull(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        /// <summary>
        /// Envia a foto para o bucket e grava a nova URL no usuário.
        /// </summary>
        /// <param name="user">Usuário que receberá a foto.</param>
        /// <param name="content">Bytes da imagem final.</param>
        /// <param name="format">Formato da imagem.</param>
        /// <returns>200 com a nova URL da foto.</returns>
        private async Task<UseCaseResult<object>> SaveProfilePicAsync(User user, byte[] content, ImageFormat format)
        {
            user.ProfilePicUrl = await profilePicService.SaveAsync(user, content, format);
            await userRepository.UpdateAsync(user);

            return new() { Content = new ProfilePicResponse { ProfilePicUrl = user.ProfilePicUrl } };
        }

        /// <summary>
        /// Monta uma resposta 400 com a mensagem exibida ao usuário.
        /// </summary>
        /// <param name="message">Motivo da recusa.</param>
        /// <returns>Resultado 400 com a mensagem.</returns>
        private static UseCaseResult<object> BadRequest(string message) => new()
        {
            StatusCode = HttpStatusCode.BadRequest,
            Content = new MessageResponse { Message = message }
        };

        private async Task<User?> GetUserAsync(Guid publicUserId)
            => (await userRepository.GetListAsync(u => u.PublicId == publicUserId)).FirstOrDefault();
    }
}
