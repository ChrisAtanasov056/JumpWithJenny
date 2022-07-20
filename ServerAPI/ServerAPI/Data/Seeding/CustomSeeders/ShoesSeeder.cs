using ServerAPI.Models;

namespace ServerAPI.Data.Seeding.CustomSeeders
{
    public class ShoesSeeder : ISeeder
    {
        public async Task SeedAsync(JumpWithJennyDbContext dbContext, IServiceProvider serviceProvider)
        {
            if (dbContext.Shoes.Any())
            {
                return;
            }
            var shoes = new Shoes[]
            {
                new Shoes
                {
                    Size = Models.Enums.ShoesSize.s,
                },
                new Shoes
                {
                    Size = Models.Enums.ShoesSize.s,
                },
                new Shoes
                {
                    Size = Models.Enums.ShoesSize.s,
                } ,
                new Shoes
                {
                    Size = Models.Enums.ShoesSize.s,
                } ,
                new Shoes
                {
                    Size = Models.Enums.ShoesSize.m,
                },
                new Shoes
                {
                    Size = Models.Enums.ShoesSize.m,
                },
                new Shoes
                {
                    Size = Models.Enums.ShoesSize.m,
                },
                new Shoes
                {
                    Size = Models.Enums.ShoesSize.m,
                },
                new Shoes
                {
                    Size = Models.Enums.ShoesSize.xl,
                }

            };
            foreach (var shoe in shoes)
            {
                await dbContext.AddAsync(shoe);
                await dbContext.SaveChangesAsync();
            }
        }
    }
}
