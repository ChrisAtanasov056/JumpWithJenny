namespace ServerAPI.Data
{
    using System;
    using System.Collections.Generic;
    using System.Linq.Expressions;
    using System.Reflection;

    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Metadata;

    internal static class EfExpressionHelper
    {
        private static readonly Type StringType = typeof(string);

        private static readonly MethodInfo EfPropertyMethod =
            typeof(EF).GetMethod(
                nameof(EF.Property),
                BindingFlags.Public | BindingFlags.Static,
                new[] { typeof(object), typeof(string) });

        public static Expression<Func<TEntity, bool>> BuildByIdPredicate<TEntity>(
            DbContext dbContext,
            object[] id)
            where TEntity : class
        {
            if (id == null)
            {
                throw new ArgumentNullException(nameof(id));
            }

            var entityType = typeof(TEntity);
            var keyProperties = dbContext.Model.FindEntityType(entityType).FindPrimaryKey().Properties;
            if (id.Length != keyProperties.Count)
            {
                throw new ArgumentException(
                    $"Expected {keyProperties.Count} key value(s) for {entityType.Name}, but received {id.Length}.",
                    nameof(id));
            }

            var entityParameter = Expression.Parameter(entityType, "e");
            var predicate = BuildPredicate(keyProperties, id, entityParameter);

            return Expression.Lambda<Func<TEntity, bool>>(predicate, entityParameter);
        }

        private static BinaryExpression BuildPredicate(
            IReadOnlyList<IProperty> keyProperties,
            object[] keyValues,
            ParameterExpression entityParameter)
        {
            var keyValuesConstant = Expression.Constant(keyValues);

            BinaryExpression predicate = null;
            for (var i = 0; i < keyProperties.Count; i++)
            {
                var property = keyProperties[i];
                var equalsExpression = Expression.Equal(
                    Expression.Call(
                        EfPropertyMethod.MakeGenericMethod(property.ClrType),
                        entityParameter,
                        Expression.Constant(property.Name, StringType)),
                    Expression.Convert(
                        Expression.ArrayIndex(keyValuesConstant, Expression.Constant(i)),
                        property.ClrType));

                predicate = predicate == null ? equalsExpression : Expression.AndAlso(predicate, equalsExpression);
            }

            return predicate;
        }
    }
}
