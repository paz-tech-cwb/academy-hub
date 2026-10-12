namespace domain.Enums
{
    /// <summary>
    /// Valores fixados explicitamente: são os ids da tabela <c>roles</c>,
    /// referenciados pela FK <c>fk_users_role</c>. Os nomes são gravados no
    /// claim do JWT (<c>user.Role.ToString()</c>) e têm que casar com
    /// <c>roles.name</c>.
    /// </summary>
    public enum Roles
    {
        User = 1,
        Admin = 2,
        Professor = 3
    }
}
