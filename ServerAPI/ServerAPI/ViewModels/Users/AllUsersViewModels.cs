namespace ServerAPI.ViewModels.Users
{
    using System;
    using System.Collections.Generic;

    public class AllUsersViewModels
    {
        public List<UserViewModel> Users { get; set; } = new List<UserViewModel>();

        public int Page { get; set; } = 1;

        public int PageSize { get; set; } = 50;

        public int TotalCount { get; set; }

        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;

        public bool HasPreviousPage => Page > 1;

        public bool HasNextPage => Page < TotalPages;
    }
}
