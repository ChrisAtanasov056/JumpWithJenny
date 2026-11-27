namespace ServerAPI.Data.Seeding.CustomSeeders
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Microsoft.EntityFrameworkCore;
    using ServerAPI.Models;
    using ServerAPI.Models.Enums;

    public class ReviewSeeder : ISeeder
    {
        public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
        {
            if (await dbContext.Reviews.IgnoreQueryFilters().AnyAsync())
            {
                return;
            }

            var baseUtc = DateTime.UtcNow;

            var initialReviews = new List<(string AuthorName, string Comment, int Rating)>
            {
                ("Мария Иванова", "Най-доброто място за тренировки. Персонализиран подход към всеки клиент и видими резултати.", 5),
                ("Стефка Николова", "Уникално изживяване! Енергията и мотивацията на тренировките са заразителни.", 5),
                ("Елена Василева", "С всяка тренировка се чувствам все по-силна и уверена. Благодарение на Жени!", 5),
                ("Антония Стоянова", "Програмите са адаптирани към всякакво ниво. Чувствам се част от страхотна общност.", 5),
                ("Десислава Георгиева", "Всяка тренировка е истинско удоволствие! Жени, винаги знае как да ни мотивира.", 5),
                ("Ива Пенева", "Обичам енергията и положителното настроение на тренировките. Перфектно за разтоварване след работа!", 4),
                ("Надежда Тодорова", "След всеки час се чувствам заредена и вдъхновена.", 5),
                ("Кристина Алексиева", "От първата тренировка се влюбих в атмосферата и начина, по който Жени работи с нас.", 5),
                ("Габриела Илиева", "Страхотна комбинация от забавление и ефективна тренировка! Виждам реална промяна.", 5),
                ("Ралица Николова", "Това не е просто тренировка – това е начин на живот!", 5),
            };

            for (var i = 0; i < initialReviews.Count; i++)
            {
                var item = initialReviews[i];
                var timestamp = baseUtc.AddMinutes(-i);

                await dbContext.Reviews.AddAsync(new Review
                {
                    AuthorName = item.AuthorName,
                    Comment = item.Comment,
                    Rating = item.Rating,
                    Status = ReviewStatus.Approved,
                    Source = "Site",
                    CreatedOn = timestamp,
                    ApprovedOn = timestamp,
                });
            }

            await dbContext.SaveChangesAsync();
        }
    }
}
